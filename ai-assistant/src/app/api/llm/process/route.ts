// app/api/llm/process/route.ts
import { NextRequest, NextResponse } from "next/server";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Validate CSRF token
  const csrfToken = request.headers.get("x-csrf-token");
  const cookieStore = request.cookies;
  const cookieToken = cookieStore.get("csrf_token")?.value;
  
  if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  
  // Validate request body
  const schema = z.object({
    conversationId: z.string().uuid(),
    query: z.string().min(1).max(10000),
    includeReasoning: z.boolean().default(false),
  });
  
  const result = await validateRequest(request, schema);
  
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error },
      { status: 400 }
    );
  }
  
  const { conversationId, query, includeReasoning } = result.data;
  
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
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
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
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }
    
    // Get conversation history
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
    });
    
    // Format messages for OpenAI with proper typing
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));
    
    // Add system message with correct type
    formattedMessages.unshift({
      role: "system",
      content: `You are a helpful assistant. Current date: ${new Date().toISOString().split('T')[0]}.`,
    });
    
    // Add current query with correct type
    formattedMessages.push({
      role: "user",
      content: sanitizedQuery,
    });
    
    // Determine model based on user tier
    const model = session.user.tier === "PRO" ? "gpt-4o" : "gpt-3.5-turbo";
    
    // Generate reasoning if requested
    let reasoning = "";
    if (includeReasoning) {
      const reasoningMessages = [
        ...formattedMessages,
        {
          role: "system" as const,
          content: "Before responding, think through this step by step.",
        },
      ];
      
      const reasoningResponse = await openai.chat.completions.create({
        model,
        messages: reasoningMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      reasoning = reasoningResponse.choices[0].message.content || "";
    }
    
    // Generate final response
    const response = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const assistantResponse = response.choices[0].message.content || "";
    const sanitizedResponse = sanitizeOutput(assistantResponse);
    
    // Store user message
    await prisma.message.create({
      data: {
        conversationId,
        userId: session.user.id,
        role: "user",
        content: sanitizedQuery,
      },
    });
    
    // Store assistant message with metadata
    const metadata = includeReasoning 
      ? { reasoning }
      : {};
      
    await prisma.message.create({
      data: {
        conversationId,
        userId: session.user.id,
        role: "assistant",
        content: sanitizedResponse,
        metadata,
      },
    });
    
    // Update conversation last activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    
    // Log API usage
    await prisma.apiUsage.create({
      data: {
        userId: session.user.id,
        endpoint: "llm/process",
        model,
        tokens: response.usage?.total_tokens || 0,
      },
    });
    
    // Return response
    return NextResponse.json({
      response: sanitizedResponse,
      reasoning: includeReasoning ? reasoning : undefined,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}