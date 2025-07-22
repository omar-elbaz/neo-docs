// get current user
// backend/src/routes/auth/me.ts

import type { FastifyInstance } from "fastify";

import { getUserFromToken } from "../../utils/auth.ts";

export const meHandler = async (fastify: FastifyInstance) => {
  fastify.get("/auth/me", async (req) => {
    const user = await getUserFromToken(req);
    return { 
      userID: user.id,
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email.split('@')[0] // Fallback to email username
    };
  });
};
