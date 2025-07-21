// user login

import type { FastifyInstance } from "fastify";
import { LoginSchema, type LoginRequest } from "../../schema/index.ts";
import { comparePassword } from "../../utils/auth.ts";
import { getPrismaClient } from "../../utils/database.ts";

export const loginHandler = async (fastify: FastifyInstance) => {
  fastify.post("/auth/login", async (req, reply) => {
    console.log("loginHandler");
    const body = LoginSchema.parse(req.body) as LoginRequest;
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) {
      console.log(
        `Login attempt failed: User not found for email ${body.email}`
      );
      return reply.status(401).send({ message: "Invalid credentials" });
    }

    if (!(await comparePassword(body.password, user.password))) {
      console.log(
        `Login attempt failed: Wrong password for user ${user.id} (${body.email})`
      );
      return reply.status(401).send({ message: "Invalid credentials" });
    }

    console.log(`Login successful for user ${user.id} (${body.email})`);
    const token = fastify.jwt.sign({ id: user.id });
    return reply.send({ token });
  });
};
