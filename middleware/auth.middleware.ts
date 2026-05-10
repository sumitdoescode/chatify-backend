import { auth } from "../lib/auth";
import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { ObjectId } from "mongodb";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!ObjectId.isValid(session.user.id)) {
            return res.status(500).json({ success: false, message: "Authenticated user id is not a valid ObjectId" });
        }

        req.user = {
            ...session.user,
            _id: new ObjectId(session.user.id),
            profileImage: session.user.image ?? null,
        };
        next();
    } catch (error) {
        return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to authenticate user" });
    }
}
