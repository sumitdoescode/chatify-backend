import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { User } from "../models/User.model.ts";
import { Resend } from "resend";
import EmailVerificationTemplate from "../emails/email-verify-template.tsx";
import DeleteAccountTemplate from "../emails/delete-account-email-template.tsx";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL!,
    database: mongodbAdapter(db),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            console.log({ url });
            const { data, error } = await resend.emails.send({
                from: "Chatify <onboarding@resend.dev>",
                to: user.email,
                subject: "Verify your email address",
                react: EmailVerificationTemplate({ name: user.name, email: user.email, verificationUrl: url }),
            });
            console.log({ data, error });
        },
    },

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    try {
                        await User.create({
                            name: user.name,
                            email: user.email,
                            emailVerified: user.emailVerified,
                        });
                    } catch (error) {
                        console.log("Error while adding user to user collection", error);
                    }
                },
            },
            update: {
                after: async (user) => {
                    try {
                        await User.updateOne(
                            { email: user.email },
                            {
                                name: user.name,
                                email: user.email,
                                emailVerified: user.emailVerified,
                                profileImage: user.profileImage,
                            },
                        );
                    } catch (error) {
                        console.log("Error while updating user in user collection", error);
                    }
                },
            },
            delete: {
                after: async (user) => {
                    try {
                        await User.deleteOne({ email: user.email });
                    } catch (error) {
                        console.log("Error while deleting user from user collection", error);
                    }
                },
            },
        },
    },
    user: {
        deleteUser: {
            enabled: true,

            // you can enable this if you want to
            sendDeleteAccountVerification: async ({ user, url, token }) => {
                console.log({ url: url });
                const { data, error } = await resend.emails.send({
                    from: "Chatify <onboarding@resend.dev>",
                    to: user.email,
                    subject: "Delete your account",
                    react: DeleteAccountTemplate({ name: user.name, email: user.email, deleteUrl: url }),
                });
                console.log({ data, error });
            },
        },
    },
});
