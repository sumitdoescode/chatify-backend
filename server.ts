import app from "./app";
import { connectDB } from "./lib/db";
import dns from "node:dns/promises";
import http from "node:http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middleware/socketAuth.middleware";

dns.setServers(["1.1.1.1", "1.0.0.1"]); // Cloudflare DNS

// http server
const httpServer = http.createServer(app);

// web socket server
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true, // enables us to send cookies in the socket connection
    },
});

io.use(socketAuthMiddleware);

const userSocketMap: Record<string, string[]> = {};

io.on("connection", (socket) => {
    console.log("a user is connected", (socket as any).user);

    const userId = (socket as any).user._id;
    if (!userSocketMap[userId]) {
        userSocketMap[userId] = [];
    }
    userSocketMap[userId].push(socket.id);

    io.emit("getOnlineUsers", userSocketMap);

    // when socket disconnects
    socket.on("disconnect", () => {
        const sockets = userSocketMap[userId]; // array of sockets
        if (!sockets) return;

        // remove that particular socket form the array
        userSocketMap[userId] = sockets.filter((id) => id !== socket.id);

        // but if the sockets array is empty
        if (userSocketMap[userId]?.length === 0) {
            delete userSocketMap[userId];
        }

        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// start server
(async () => {
    try {
        await connectDB();
        // start listening to port
        const PORT = process.env.PORT || 8000;

        httpServer.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (error) {
        console.error("SERVER START ERROR:", error);
    }
})();
