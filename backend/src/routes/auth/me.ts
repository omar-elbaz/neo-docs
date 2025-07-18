// get current user
// backend/src/routes/auth/me.ts

import { FastifyInstance } from "fastify";
import { getUserFromToken } from "../../utils/auth";

export const meHandler = async (fastify: FastifyInstance) => {
  fastify.get("/me", async (req) => {
    const user = await getUserFromToken(req);
    return { userID: user.id };
  });
};
