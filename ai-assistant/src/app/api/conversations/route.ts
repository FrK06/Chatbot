// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sanitizeInput } from "@/lib/sanitize";
import { jwtVerify } from "jose";

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

// Get all conversations
export async function GET(request: NextRequest) {
  try {
    // Debug information
    console.log("Cookies:", request.cookies);
    console.log("Auth header:", request.headers.get("authorization"));
    console.log("CSRF token:", request.headers.get("x-csrf-token"));

    // First try to get user from session token
    let userId = null;
    
    // Get token from cookies
    const token = request.cookies.get("session-token")?.value;
    console.log("Token from cookies:", token ? token.substring(0, 20) + "..." : "none");
    
    if (token) {
      // Verify the JWT token
      const verification = await verifyToken(token);
      
      if (verification.isValid && verification.payload) {
        userId = verification.payload.id as string;
        console.log("User authenticated via JWT token, ID:", userId);
      } else {
        console.log("Invalid JWT token");
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    
    console.log("Querying conversations for user:", userId);
    
    // 3. Query conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: userId,
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
    
    console.log("Found conversations:", conversations.length);
    
    // 4. Get total count for pagination
    const total = await prisma.conversation.count({
      where: {
        userId: userId,
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
    // Debug information
    console.log("Cookies:", request.cookies);
    console.log("Auth header:", request.headers.get("authorization"));
    console.log("CSRF token:", request.headers.get("x-csrf-token"));

    // First try to get user from session token
    let userId = null;
    
    // Get token from cookies
    const token = request.cookies.get("session-token")?.value;
    console.log("Token from cookies:", token ? token.substring(0, 20) + "..." : "none");
    
    if (token) {
      // Verify the JWT token
      const verification = await verifyToken(token);
      
      if (verification.isValid && verification.payload) {
        userId = verification.payload.id as string;
        console.log("User authenticated via JWT token, ID:", userId);
      } else {
        console.log("Invalid JWT token");
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
        userId: userId,
        title: sanitizedTitle,
      },
    });
    
    console.log("Created new conversation:", conversation.id);
    
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