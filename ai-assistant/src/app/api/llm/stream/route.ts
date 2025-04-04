// app/api/llm/stream/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { OpenAI } from "openai";
import { validateRequest } from "@/lib/validate";
import { sanitizeInput, sanitizeOutput } from "@/lib/sanitize";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401 }
    );
  }
  
  // Validate CSRF token
  const csrfToken = request.headers.get("x-csrf-token");
  const cookieStore = request.cookies;
  const cookieToken = cookieStore.get("csrf_token")?.value;
  
  if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
    return new Response(
      JSON.stringify({ error: "Invalid CSRF token" }), 
      { status: 403 }
    );
  }
  
  // Validate request body
  const schema = z.object({
    conversationId: z.string().uuid(),
    query: z.string().min(1).max(10000),
  });
  
  const result = await validateRequest(request, schema);
  
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: result.error }), 
      { status: 400 }
    );
  }
  
  const { conversationId, query } = result.data;
  
  // Sanitize input
  const sanitizedQuery = sanitizeInput(query);
  
  try {
    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
        isDeleted: false,
      },
    });
    
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }), 
        { status: 404 }
      );
    }
    
    // Apply rate limiting
    const rateLimit = session.user.tier === "PRO" ? 5 : 1;
    const rateLimitKey = `rate:${session.user.id}:llm`;
    const currentRequests = await redis.incr(rateLimitKey);
    
    if (currentRequests === 1) {
      // Set expiry for rate limit key (1 second)
      await redis.expire(rateLimitKey, 1);
    }
    
    if (currentRequests > rateLimit) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }), 
        { status: 429 }
      );
    }
    
    // Store user message
    await prisma.message.create({
      data: {
        conversationId,
        userId: session.user.id,
        role: "user",
        content: sanitizedQuery,
      },
    });
    
    // Get conversation history
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
    });
    
    // Format messages for OpenAI
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Add system message
    formattedMessages.unshift({
      role: "system",
      content: `You are a helpful assistant. Current date: ${new Date().toISOString().split('T')[0]}.`,
    });
    
    // Determine model based on user tier
    const model = session.user.tier === "PRO" ? "gpt-4o" : "gpt-3.5-turbo";
    
    // Create stream response
    const stream = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });
    
    // Set up response streaming
    const encoder = new TextEncoder();
    let fullResponse = "";
    
    const responseStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            fullResponse += content;
          }
        }
        
        // Send the 'done' event
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        
        // Store the complete response
        const sanitizedResponse = sanitizeOutput(fullResponse);
        await prisma.message.create({
          data: {
            conversationId,
            userId: session.user.id,
            role: "assistant",
            content: sanitizedResponse,
          },
        });
        
        // Update conversation last activity
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
        
        controller.close();
      },
    });
    
    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error streaming response:", error);
    return new Response(
      JSON.stringify({ error: "Failed to stream response" }), 
      { status: 500 }
    );
  }
}