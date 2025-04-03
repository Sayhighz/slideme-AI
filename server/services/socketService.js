import { Server } from "socket.io";

const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:4000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ room_id, user_id }) => {
      if (room_id && user_id) {
        socket.join(room_id);
        console.log(`User ${user_id} (Socket ID: ${socket.id}) joined room: ${room_id}`);
      } else {
        console.error("Room ID or User ID is undefined or missing.");
      }
    });

    socket.on("sendMessage", ({ room_id, user_id, message }) => {
      if (room_id && user_id && message) {
        console.log(`Message from User ${user_id} in room ${room_id}: ${message}`);
        io.to(room_id).emit("receiveMessage", { message, sender: user_id });
      } else {
        console.error("Room ID, User ID, or message is undefined or missing.");
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export default configureSocket;
