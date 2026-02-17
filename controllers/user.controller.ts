import type { Request, Response } from "express";
import { Register, Login } from "../schemas/user.schema.ts";
import { flattenError } from "zod";
import { auth } from "../lib/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { User } from "../models/User.model.ts";
import { APIError, makeErrorForHideStackFrame } from "better-auth";
import type { USERNAME_ERROR_CODES } from "better-auth/plugins";

// GET => api/user
// export async function getLoggedInUser(req: Request, res: Response) {
//     try {
//         res.status(200).json({
//             success: true,
//             message: "User fetched successfully",
//             user: (req as any).user,
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

// GET => /api/users
export async function getAllUsers(req: Request, res: Response) {
    try {
        const loggedInUser = (req as any).user;

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
            message: error instanceof Error ? error.message : "Something went wrong",
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
                callbackURL: "/",
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
            message: error instanceof Error ? error.message : "Something went wrong",
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

        if (authResponse.status === 403) {
            return res.status(403).json({ success: false, message: "Email not verified" });
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

// update user
// PATCH => api/users
// export async function updateUser(req: Request, res: Response) {
//     try {
//         const { name, email, password } = req.body;
//         const result = SignUp.safeParse({ name, email, password });
//         if (!result.success) {
//             return res.status(400).json({ success: false, error: flattenError(result.error).fieldErrors });
//         }

//         await auth.api.updateUser({
//             body: {
//                 name,
//                 email,
//                 password,
//             },
//         });

//         res.status(200).json({
//             success: true,
//             message: "User updated successfully",
//         });
//     } catch (error: any) {
//         res.status(error.statusCode || 500).json({
//             success: false,
//             message: error.message || "Something went wrong",
//         });
//     }
// }

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
