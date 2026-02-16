import type { Request, Response } from "express";
import { sendMessageSchema } from "../schemas/message.schema";
import { flattenError } from "zod";
import { isValidObjectId } from "mongoose";
import { User } from "../models/User.model";
import { Message } from "../models/Message.model";
import { Chat } from "../models/Chat.model";

// POST => /api/messages/:id , id => receiver user id
export async function sendMessage(req: Request, res: Response) {
    try {
        const sender = (req as any).user;
        const receiverId = req.params.id;

        if (!receiverId || !isValidObjectId(receiverId)) {
            return res.status(400).json({ success: false, message: "Invalid receiver ID" });
        }

        if (sender._id.toString() === receiverId) {
            return res.status(400).json({ success: false, message: "Cannot send message to yourself" });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, message: "Receiver not found" });
        }

        const { text } = req.body;
        const result = sendMessageSchema.safeParse({ text });
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: flattenError(result.error).fieldErrors,
            });
        }

        let chat = await Chat.findOne({
            $or: [
                { participant1: sender._id, participant2: receiver._id },
                { participant1: receiver._id, participant2: sender._id },
            ],
        } as any);

        if (!chat) {
            // if chat didn't exist create one
            chat = await Chat.create({
                participant1: sender._id,
                participant2: receiver._id,
            } as any);
        }

        const message = await Message.create({
            chat: chat._id,
            sender: sender._id,
            receiver: receiver._id,
            text: text,
        } as any);

        chat.lastMessage = message._id as any;
        await chat.save();

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
        });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }
}
