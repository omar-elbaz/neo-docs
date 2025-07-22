import { JwtPayloadSchema, type JwtPayload } from "../schema/index.ts";
import { getPrismaClient } from "./database.ts";

export const getUserFromToken = async (req: any) => {
  await req.jwtVerify();
  const payload = JwtPayloadSchema.parse(req.user);
  
  // Fetch full user details from database
  const prisma = getPrismaClient();
  const user = await prisma.users.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const bcrypt = await import("bcrypt");
  return bcrypt.compare(password, hash);
};
