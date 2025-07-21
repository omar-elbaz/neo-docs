import { JwtPayloadSchema, type JwtPayload } from "../schema/index.ts";

export const getUserFromToken = async (req: any): Promise<JwtPayload> => {
  await req.jwtVerify();
  const payload = JwtPayloadSchema.parse(req.user);
  return payload;
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
