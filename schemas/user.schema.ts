import * as z from "zod";

export const SignUp = z.object({
    name: z.string().min(3, "Name must be atleast of 3 charaters").max(20, "Name must be less than of 20 characters"),
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password must be atleast of 8 charaters").max(50, "Password must be less than of 50 characters"),
});

export const Login = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password must be atleast of 8 charaters").max(50, "Password must be less than of 50 characters"),
});
