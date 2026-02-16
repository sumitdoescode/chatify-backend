import express from "express";
import { auth } from "./lib/auth.ts";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import cookieParser from "cookie-parser";
import messageRouter from "./routes/message.routes.ts";
import userRouter from "./routes/user.routes.ts";
import chatRouter from "./routes/chat.routes.ts";

const app = express();

// middlewares
app.use(
    cors({
        origin: "*", // Replace with your frontend's origin
        methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
        credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    }),
);
app.use(cookieParser());

// better auth api routes
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// custom api routes
app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/chats", chatRouter);

export default app;
