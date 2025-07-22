// register users
import type { FastifyInstance } from "fastify";
import { RegisterSchema, type RegisterRequest } from "../../schema/index.ts";
import { hashPassword } from "../../utils/auth.ts";
import { getPrismaClient } from "../../utils/database.ts";

export default async function registerHandler(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    console.log("registerHandler");
    const body = RegisterSchema.parse(req.body) as RegisterRequest;
    const prisma = getPrismaClient();

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      console.log(
        `Registration failed: User already exists for email ${body.email}`
      );
      return reply.status(409).send({ message: "User already exists" });
    }

    const hashed = await hashPassword(body.password);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: body.email,
        password: hashed,
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        updatedAt: new Date(),
      },
    });

    console.log(`User created successfully: ${user.id} (${body.email})`);
    const token = app.jwt.sign({ id: user.id });
    return reply.send({ token });
  });
}
