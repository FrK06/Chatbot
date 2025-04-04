import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sanitizeInput } from "@/lib/sanitize";

// Get all conversations
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    
    // 3. Query conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
        isDeleted: false,
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });
    
    // 4. Get total count for pagination
    const total = await prisma.conversation.count({
      where: {
        userId: session.user.id,
        isDeleted: false,
      },
    });
    
    // 5. Format response
    return NextResponse.json({
      conversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// Create new conversation
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Validate request body
    const body = await request.json();
    const schema = z.object({
      title: z.string().min(1).max(255).default("New conversation"),
    });
    
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // 3. Sanitize title
    const sanitizedTitle = sanitizeInput(validation.data.title);
    
    // 4. Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: sanitizedTitle,
      },
    });
    
    // 5. Return new conversation
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}