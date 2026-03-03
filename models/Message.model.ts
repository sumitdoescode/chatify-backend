import { Schema, model, type ObjectId, type Document } from "mongoose";

export interface IMessage extends Document {
    chat: ObjectId;
    sender: ObjectId;
    receiver: ObjectId;
    text: string;
    image: string;
    isRead: boolean;
    readAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        chat: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

// remove the message image from vercel blob storage before message deletion

export const Message = model<IMessage>("Message", messageSchema);
