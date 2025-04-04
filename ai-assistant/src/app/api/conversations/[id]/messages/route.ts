// app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { validateRequest } from "@/lib/validate";
import { sanitizeInput } from "@/lib/sanitize";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const conversationId = params.id;
  
  try {
    // First check if conversation belongs to user
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
    
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        metadata: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  
  const conversationId = params.id;
  
  // Validate request body
  const schema = z.object({
    content: z.string().min(1).max(10000),
  });
  
  const result = await validateRequest(request, schema);
  
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error },
      { status: 400 }
    );
  }
  
  // Sanitize input
  const sanitizedContent = sanitizeInput(result.data.content);
  
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
    
    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        userId: session.user.id,
        role: "user",
        content: sanitizedContent,
      },
    });
    
    // Return the created message
    return NextResponse.json(userMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}