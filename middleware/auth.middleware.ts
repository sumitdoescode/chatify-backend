import { auth } from "../lib/auth";
import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        req.user = session.user;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to authenticate user" });
    }
}
