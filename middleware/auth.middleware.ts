import { auth } from "../lib/auth";
import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { User } from "../models/User.model";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findOne({ email: session?.user?.email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        req.user = user;
        next();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.log(error);
        return res.status(500).json({ success: false, message });
    }
}
