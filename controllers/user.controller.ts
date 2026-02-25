import type { Request, Response } from "express";
import { Register, Login } from "../schemas/user.schema.ts";
import { flattenError } from "zod";
import { auth } from "../lib/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { User } from "../models/User.model.ts";
import { APIError } from "better-auth";
import { isValidObjectId } from "mongoose";

// GET => /api/users
export async function getAllUsers(req: Request, res: Response) {
    try {
        const loggedInUser = (req as any).user;
        console.log({ loggedInUser });

        const users = await User.find({ _id: { $ne: loggedInUser._id } }).select("name email profileImage");
        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users,
        });
    } catch (error) {
        console.error("GET ALL USERS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
}

// GET => /api/users/:id
export async function getUserById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid user id" });
        }
        const user = await User.findById(id).select("_id name email profileImage");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            user,
        });
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
}

// GET => api/users/me
export async function getCurrentUser(req: Request, res: Response) {
    try {
        const loggedInUser = (req as any).user;
        res.status(200).json({
            success: true,
            message: "User fetched successfully",
            user: loggedInUser,
        });
    } catch (error) {
        console.error("GET CURRENT USER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
}

// api/users/signup
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
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        if (error instanceof APIError) {
            return res.status(error.statusCode || 500).json({ success: false, errors: { email: [error.message] } });
        }

        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
}

// api/users/login
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        const result = Login.safeParse({ email, password });

        if (!result.success) {
            return res.status(400).json({ success: false, error: flattenError(result.error).fieldErrors });
        }

        const authResponse = await auth.api.signInEmail({
            body: {
                email,
                password,
                rememberMe: true,
            },
            asResponse: true,
        });

        if (authResponse.status === 401) {
            return res.status(401).json({ success: false, errors: { password: ["Invalid credentials"] } });
        }

        if (authResponse.status === 403) {
            return res.status(403).json({ success: false, errors: { email: ["Email not verified, please verify your email to login"] } });
        }
        authResponse.headers.forEach((value, key) => {
            // Express handles Set-Cookie specially when value is array/string
            res.setHeader(key, value);
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
}

// Edit user profile
// PATCH => api/users
export async function editProfile(req: Request, res: Response) {
    try {
        const { name } = req.body;
        // const profileImage = req.filter;

        // if (!result.success) {
        //     return res.status(400).json({ success: false, error: flattenError(result.error).fieldErrors });
        // }

        await auth.api.updateUser({
            body: {
                name,
            },
        });

        res.status(200).json({
            success: true,
            message: "User updated successfully",
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
}

// DELETE => api/users
// export async function deleteUser(req: Request, res: Response) {
//     try {
//         await auth.api.deleteUser({
//             body: {
//                 callbackURL: "/",
//             },
//         });
//         res.status(200).json({
//             success: true,
//             message: "User deleted successfully",
//         });
//     } catch (error) {
//         if (error instanceof Error) {
//             console.log(error);
//             res.status(500).json({
//                 success: false,
//                 message: error.message || "Something went wrong",
//             });
//         }
//     }
// }
