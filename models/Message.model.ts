import { Schema, model, type ObjectId, type Document } from "mongoose";

export interface IMessage extends Document {
    chat: ObjectId;
    sender: ObjectId;
    receiver: ObjectId;
    text: string;
    image: string;
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
    },
    {
        timestamps: true,
    },
);

export const Message = model<IMessage>("Message", messageSchema);
