import { auth } from "../lib/auth";
import type { Socket } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { User } from "../models/User.model";

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(socket.handshake.headers),
        });

        if (!session?.user) {
            return next(new Error("Unauthorized"));
        }

        const user = await User.findOne({ email: session?.user?.email });
        if (!user) {
            return next(new Error("Unauthorized"));
        }

        console.log({ user });
        (socket as any).user = user;
        (socket as any).userId = user._id.toString();
        next();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.log("SOCKET AUTH ERROR:", error);
        return next(new Error(message));
    }
}
