import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const prisma = new PrismaClient();

export const isNotFoundError = (err: any): boolean =>
  err instanceof PrismaClientKnownRequestError && err.code === "P2025";
