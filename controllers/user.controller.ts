import type { Request, Response } from "express";
import { Register, Login } from "../schemas/user.schema.ts";
import { flattenError } from "zod";
import { auth } from "../lib/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { put, del } from "@vercel/blob";
import { getDB } from "../lib/db.ts";
import { ObjectId } from "mongodb";

// GET => /api/users
export async function getAllUsers(req: Request, res: Response) {
    try {
        const db = getDB();
        if (!db) {
            return res.status(500).json({ success: false, message: "Database connection failed" });
        }
        const users = await db
            .collection("user")
            .find(
                {
                    _id: { $ne: new ObjectId(req.user!.id) },
                },
                {
                    projection: {
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                },
            )
            .toArray();

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
}

// GET => /api/users/me
export async function getCurrentUser(req: Request, res: Response) {
    try {
        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            user: req.user,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
}

// POST => /api/users/register
export async function register(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;
        const result = Register.safeParse({ name, email, password });
        if (!result.success) {
            return res.status(400).json({ success: false, errors: flattenError(result.error).fieldErrors });
        }

        try {
            const authResponse = await auth.api.signUpEmail({
                body: {
                    name,
                    email,
                    password,
                    callbackURL: `${process.env.FRONTEND_URL}/login`,
                },
                headers: fromNodeHeaders(req.headers),
                asResponse: true,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Error while registering user",
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Error while registering user" });
    }
}

// POST => /api/users/login
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        const result = Login.safeParse({ email, password });

        if (!result.success) {
            return res.status(400).json({ success: false, error: flattenError(result.error).fieldErrors });
        }

        try {
            const authResponse = await auth.api.signInEmail({
                body: { email, password, rememberMe: true },
                headers: fromNodeHeaders(req.headers),
                asResponse: true,
            });

            const setCookies = authResponse.headers.getSetCookie?.() ?? authResponse.headers.getAll?.("set-cookie") ?? [];

            authResponse.headers.forEach((value, key) => {
                if (key.toLowerCase() === "set-cookie") {
                    return;
                }

                res.setHeader(key, value);
            });

            if (setCookies.length) {
                res.setHeader("Set-Cookie", setCookies);
            }

            return res.status(authResponse.status).send(await authResponse.text());
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Error while logging in user",
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Error while logging in user" });
    }
}

// POST => /api/users/profile-image
export async function uploadProfileImage(req: Request, res: Response) {
    try {
        const file = req.file as Express.Multer.File | undefined;

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // upload the new profile image to vercel blob storage
        const blob = await put(`profile-images/${file.originalname}`, file.buffer, {
            access: "public",
            addRandomSuffix: true,
            contentType: file.mimetype,
        });

        // delete the old profile image from vercel blob storage (check if oldProfileImage exists)
        const oldProfileImage = req.user!.image || (typeof req.body.oldProfileImage === "string" ? req.body.oldProfileImage : "");
        if (oldProfileImage) {
            try {
                await del(oldProfileImage);
            } catch (blobDeleteError) {
                console.error("OLD PROFILE IMAGE DELETE ERROR:", blobDeleteError);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Profile image uploaded successfully",
            image: blob.url,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Something went wrong" });
    }
}
