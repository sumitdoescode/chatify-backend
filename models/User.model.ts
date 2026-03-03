import { Schema, model, type Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: boolean;
  profileImage: string;
  createdAt: Date;
  updatedAt: Date;
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
