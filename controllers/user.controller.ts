import type { Request, Response } from "express";
import { Register, Login } from "../schemas/user.schema.ts";
import { flattenError } from "zod";
import { auth } from "../lib/auth.ts";
import { User } from "../models/User.model.ts";
import { APIError } from "better-auth";
import { isValidObjectId } from "mongoose";
import { Message } from "../models/Message.model.ts";
import { Chat } from "../models/Chat.model.ts";
import { put, del } from "@vercel/blob";

// GET => /api/users
export async function getAllUsers(req: Request, res: Response) {
    try {
        const loggedInUser = req.user;
        const users = await User.find({ _id: { $ne: loggedInUser?._id } }).select("name email profileImage");

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("GET ALL USERS ERROR:", error);
        return res.status(500).json({ success: false, message });
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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("GET CURRENT USER ERROR:", error);
        return res.status(500).json({ success: false, message });
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

        const data = await auth.api.signUpEmail({
            body: {
                name,
                email,
                password,
                callbackURL: `${process.env.FRONTEND_URL}/login`,
            },
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully, verify your email to login",
            user: data,
        });
    } catch (error: unknown) {
        console.error("REGISTER ERROR:", error);
        if (error instanceof APIError) {
            return res.status(error.statusCode || 500).json({
                success: false,
                errors: { email: [error.message] },
            });
        }

        const message = error instanceof Error ? error.message : "Internal Server Error";
        return res.status(500).json({ success: false, message });
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

        const authResponse = await auth.api.signInEmail({
            body: { email, password, rememberMe: true },
            asResponse: true,
        });

        if (authResponse.status === 401) {
            return res.status(401).json({ success: false, errors: { password: ["Invalid credentials"] } });
        }

        if (authResponse.status === 403) {
            return res.status(403).json({ success: false, errors: { email: ["Email not verified, please verify your email to login"] } });
        }

        authResponse.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({ success: false, message });
    }
}

// POST => /api/users/profile-image
export async function uploadProfileImage(req: Request, res: Response) {
    try {
        const loggedInUser = req.user;
        const file = req.file as Express.Multer.File | undefined;

        if (!loggedInUser?._id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

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
        const oldProfileImage = loggedInUser.profileImage || (typeof req.body.oldProfileImage === "string" ? req.body.oldProfileImage : "");
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
            profileImageUrl: blob.url,
        });
    } catch (error: unknown) {
        console.error("UPLOAD PROFILE IMAGE ERROR:", error);
        const message = error instanceof Error ? error.message : "Something went wrong";
        return res.status(500).json({ success: false, message });
    }
}
