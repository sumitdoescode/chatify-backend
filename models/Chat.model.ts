import { Schema, model, type ObjectId, type Document } from "mongoose";

interface IChat extends Document {
    participant1: ObjectId;
    participant2: ObjectId;
    lastMessage: ObjectId;
    unreadCountP1: number;
    unreadCountP2: number;
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
    {
        participant1: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        participant2: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
        unreadCountP1: {
            type: Number,
            default: 0,
        },
        unreadCountP2: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

export const Chat = model<IChat>("Chat", chatSchema);
