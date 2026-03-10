import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { User } from "../models/User.model.ts";
import { Chat } from "../models/Chat.model.ts";
import { Message } from "../models/Message.model.ts";
import { Resend } from "resend";
import EmailVerificationTemplate from "../emails/email-verify-template.tsx";
import DeleteAccountTemplate from "../emails/delete-account-email-template.tsx";
import { del } from "@vercel/blob";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL!,
    database: mongodbAdapter(db),

    trustedOrigins: [process.env.FRONTEND_URL!],

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            console.log({ url });
            const { data, error } = await resend.emails.send({
                from: `Chatify <${process.env.EMAIL_FROM}>`,
                to: user.email,
                subject: "Verify your email address",
                react: EmailVerificationTemplate({ name: user.name, email: user.email, verificationUrl: url }),
            });
            if (error) {
                console.log("Error while sending verification email", error);
            }
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
                                profileImage: user.image,
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
                        const dbUser = await User.findOne({ email: user.email }).select("_id profileImage").lean();

                        if (!dbUser?._id) {
                            return;
                        }

                        const messageFilter: any = {
                            $or: [{ sender: dbUser._id }, { receiver: dbUser._id }],
                        };

                        const messageImages = await Message.find({ ...messageFilter, image: { $exists: true, $ne: "" } } as any)
                            .select("image -_id")
                            .lean();

                        const imageUrls: string[] = messageImages.map((message: any) => message.image).filter(Boolean);
                        if (dbUser.profileImage) {
                            imageUrls.push(dbUser.profileImage);
                        }

                        const uniqueImageUrls = [...new Set(imageUrls)];
                        if (uniqueImageUrls.length) {
                            try {
                                await del(uniqueImageUrls);
                            } catch (blobError) {
                                console.log("Error while deleting blob images during account deletion", blobError);
                            }
                        }

                        await Promise.all([Message.deleteMany(messageFilter), Chat.deleteMany({ $or: [{ participant1: dbUser._id }, { participant2: dbUser._id }] } as any), User.deleteOne({ _id: dbUser._id })]);
                    } catch (error) {
                        console.log("Error while deleting user, chats, messages and blob images", error);
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
                    from: `Chatify <${process.env.EMAIL_FROM}>`,
                    to: user.email,
                    subject: "Delete your account",
                    react: DeleteAccountTemplate({ name: user.name, email: user.email, deleteUrl: url }),
                });
                if (error) {
                    console.log("Error while sending delete account verification email", error);
                }
            },
        },
    },
});
