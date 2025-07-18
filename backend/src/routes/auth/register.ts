// register users
import { FastifyInstance } from "fastify";
import { RegisterSchema, type RegisterRequest } from "../../schema";
import { hashPassword } from "../../utils/auth";
import { getPrismaClient } from "../../utils/database";

export const registerHandler = async (fastify: FastifyInstance) => {
  fastify.post("/auth/register", async (req, reply) => {
    const body = RegisterSchema.parse(req.body) as RegisterRequest;
    const hashed = await hashPassword(body.password);
    const prisma = getPrismaClient();

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
      },
    });

    const token = fastify.jwt.sign({ id: user.id });
    return { token };
  });
};
