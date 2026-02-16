import { auth } from "../lib/auth";
import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { User } from "../models/User.model";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findOne({ email: session?.user.email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        (req as any).user = user;
        next();
    } catch (error) {
        if (error instanceof Error) {
            console.log(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
