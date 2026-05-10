import { auth } from "../lib/auth";
import type { Socket } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(socket.handshake.headers),
        });

        if (!session?.user) {
            return next(new Error("Unauthorized"));
        }

        (socket as any).user = session.user;
        (socket as any).userId = session.user.id.toString();
        next();
    } catch (error) {
        return next(new Error(error instanceof Error ? error.message : "Failed to authenticate socket connection"));
    }
}
