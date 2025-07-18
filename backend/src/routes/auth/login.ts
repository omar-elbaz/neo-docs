// user login
import { FastifyInstance } from "fastify";
import { LoginSchema, type LoginRequest } from "../../schema";
import { comparePassword } from "../../utils/auth";
import { getPrismaClient } from "../../utils/database";

export const loginHandler = async (fastify: FastifyInstance) => {
  fastify.post("/auth/login", async (req, reply) => {
    const body = LoginSchema.parse(req.body) as LoginRequest;
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await comparePassword(body.password, user.password)))
      return reply.status(401).send({ message: "Invalid credentials" });

    const token = fastify.jwt.sign({ id: user.id });
    return { token };
  });
};
