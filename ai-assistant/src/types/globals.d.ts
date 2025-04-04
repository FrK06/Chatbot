import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";

declare global {
  var redis: Redis | undefined;
  var prisma: PrismaClient | undefined;
}