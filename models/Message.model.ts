import { Schema, model, type ObjectId, Document } from "mongoose";

interface IMessage extends Document {
    sender: ObjectId;
    receiver: ObjectId;
    text: string;
    image: string;
}

const messageSchema = new Schema<IMessage>(
    {
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

// if Message collection already exists then use that collection and don't create one
export const Message = model<IMessage>("Message", messageSchema);
