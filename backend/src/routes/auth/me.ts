// get current user
// backend/src/routes/auth/me.ts

import type { FastifyInstance } from "fastify";

import { getUserFromToken } from "../../utils/auth.ts";

export const meHandler = async (fastify: FastifyInstance) => {
  fastify.get("/auth/me", async (req) => {
    const user = await getUserFromToken(req);
    return { userID: user.id };
  });
};
