import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "../server";

const server = createServer(app.server);
export const io = new Server(server, {
  cors: { origin: "*" },
});

export const registerSocketEvents = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("user connect", socket.id);

    socket.on("join", (docId) => {
      socket.join(docId);
    });

    socket.on("edit", (data) => {
      io.to(data.docId).emit("receive-edit", data.content);
    });
  });
};
