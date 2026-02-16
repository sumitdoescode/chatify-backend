import { Schema, model, type ObjectId, type Document } from "mongoose";

interface IChat extends Document {
    participant1: ObjectId;
    participant2: ObjectId;
    lastMessage: ObjectId;
}

const chatSchema = new Schema<IChat>({
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
});

export const Chat = model<IChat>("Chat", chatSchema);
