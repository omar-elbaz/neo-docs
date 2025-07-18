// backend/src/server.ts
import cors from "@fastify/cors";
// import "@fastify/jwt";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
import Fastify from "fastify";
import process from "process";
import { loginHandler } from "./routes/auth/login";
import { meHandler } from "./routes/auth/me";
import { registerHandler } from "./routes/auth/register";
import { documentHandlers } from "./routes/documents";
import { io, registerSocketEvents } from "./websocket";

dotenv.config();
export const app = Fastify();

await registerSocketEvents(io);

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET! });

// Register route handlers
await registerHandler(app);
await loginHandler(app);
await meHandler(app);
await documentHandlers(app);

const port = parseInt(process.env.PORT || "3001");
app.listen({ port: port }, () =>
  console.log(`Fastify Server Running: http://localhost:${port}`)
);
