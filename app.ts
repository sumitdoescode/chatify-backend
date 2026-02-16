import express from "express";
import { auth } from "./lib/auth.ts";
import { toNodeHandler } from "better-auth/node";
import messageRouter from "./routes/message.routes.ts";
import userRouter from "./routes/user.routes.ts";
import cors from "cors";
import cookieParser from "cookie-parser";

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
app.use("/api/user", userRouter);
app.use("/api/messages", messageRouter);

export default app;
