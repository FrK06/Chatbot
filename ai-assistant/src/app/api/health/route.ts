import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };
  
  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = "connected";
  } catch (error) {
    healthStatus.services.database = "disconnected";
    healthStatus.status = "degraded";
  }
  
  // Check Redis connection
  try {
    await redis.ping();
    healthStatus.services.redis = "connected";
  } catch (error) {
    healthStatus.services.redis = "disconnected";
    healthStatus.status = "degraded";
  }
  
  // Set appropriate status code
  const statusCode = healthStatus.status === "healthy" ? 200 : 503;
  
  return NextResponse.json(healthStatus, { status: statusCode });
}