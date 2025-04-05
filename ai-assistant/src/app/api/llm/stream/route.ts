// Modified: src/app/api/llm/stream/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { OpenAI } from "openai";
import { validateRequest } from "@/lib/validate";
import { sanitizeInput, sanitizeOutput } from "@/lib/sanitize";
import { jwtVerify } from "jose";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to verify JWT token
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "fallback_secret_change_this_in_production"
  );
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return { isValid: true, payload };
  } catch (error) {
    console.error("JWT verification error:", error);
    return { isValid: false, error };
  }
}

export async function POST(request: NextRequest) {
  console.log("POST LLM Stream - Cookies:", request.cookies);
  console.log("POST LLM Stream - CSRF token header:", request.headers.get("x-csrf-token"));
  
  // First try to get user from session token
  let userId = null;
  
  // Get token from cookies
  const token = request.cookies.get("session-token")?.value;
  console.log("POST LLM Stream - Token from cookies:", token ? token.substring(0, 20) + "..." : "none");
  
  if (token) {
    // Verify the JWT token
    const verification = await verifyToken(token);
    
    if (verification.isValid && verification.payload) {
      userId = verification.payload.id as string;
      console.log("User authenticated via JWT token, ID:", userId);
    } else {
      console.log("Invalid JWT token:", verification.error);
    }
  }
  
  // Fallback to auth header if token wasn't in cookies
  if (!userId) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const bearerToken = authHeader.substring(7);
      const verification = await verifyToken(bearerToken);
      
      if (verification.isValid && verification.payload) {
        userId = verification.payload.id as string;
        console.log("User authenticated via Authorization header, ID:", userId);
      } else {
        console.log("Invalid bearer token");
      }
    }
  }
  
  // Fallback to NextAuth session as last resort
  if (!userId) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      console.log("User authenticated via NextAuth session, ID:", userId);
    }
  }
  
  // If no valid authentication found, return unauthorized
  if (!userId) {
    console.log("No valid authentication found");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }), 
      { status: 401 }
    );
  }
  
  // Parse request data
  let requestBody;
  try {
    requestBody = await request.json();
    console.log("Request body:", requestBody);
  } catch (error) {
    console.error("Error parsing request JSON:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }), 
      { status: 400 }
    );
  }
  
  // Validate request body
  const schema = z.object({
    conversationId: z.string().uuid(),
    query: z.string().min(1).max(10000),
  });
  
  const validation = schema.safeParse(requestBody);
  
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: validation.error }), 
      { status: 400 }
    );
  }
  
  const { conversationId, query } = validation.data;
  
  // Sanitize input
  const sanitizedQuery = sanitizeInput(query);
  
  try {
    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId,
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
    const rateLimit = userId ? 5 : 1; // Default to lower rate limit if userId is somehow missing
    const rateLimitKey = `rate:${userId}:llm`;
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
        userId: userId,
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
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));
    
    // Add system message
    formattedMessages.unshift({
      role: "system",
      content: `You are a helpful assistant. Current date: ${new Date().toISOString().split('T')[0]}.`,
    });
    
    // Look up the user to get their tier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    const userTier = user?.tier || "FREE";
    const model = userTier === "PRO" ? "gpt-4o" : "gpt-3.5-turbo";
    
    console.log(`Using model ${model} for user with tier ${userTier}`);
    
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
            userId: userId,
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