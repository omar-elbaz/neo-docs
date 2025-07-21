import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import { Server } from "socket.io";
import { loginHandler } from "./routes/auth/login.ts";
import { meHandler } from "./routes/auth/me.ts";
import registerHandler from "./routes/auth/register.ts";
import { documentHandlers } from "./routes/documents.ts";
import { registerSocketEvents } from "./websocket/index.ts";

const app = Fastify();

await app.register(cors, {
  origin: true, // allow all origins
  // origin: ['http://localhost:5173'], // restrict to specific origin
  // credentials: true, // if you're using cookies or auth headers
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-jwt-secret",
});
const PORT = 3001;

app.get("/test", async (req, reply) => {
  return { message: "Test route works!" };
});

await registerHandler(app);
await loginHandler(app);
await meHandler(app);
await documentHandlers(app);

// Start Fastify rest api server first
await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Server running at http://localhost:${PORT}`);

// Create Socket.IO server attached to the same port
const io = new Server(app.server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register WebSocket events with authentication
registerSocketEvents(io, app);

console.log(app.printRoutes());
