import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
    name: string;
    email: string;
    emailVerified: boolean;
    profileImage: string;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        profileImage: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

export const User = model<IUser>("User", userSchema);
