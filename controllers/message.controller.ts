import type { Request, Response } from "express";
import { sendMessageSchema } from "../schemas/message.schema";
import { flattenError } from "zod";
import { isValidObjectId } from "mongoose";
import { User } from "../models/User.model";
import { Message } from "../models/Message.model";
import { Chat } from "../models/Chat.model";
import { put } from "@vercel/blob";
import { io } from "../server";

// POST => /api/messages/:id , id => receiver user id
export async function sendMessage(req: Request, res: Response) {
    try {
        const sender = req.user;
        const receiverId = req.params.id;

        if (!sender?._id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

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

        const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

        const file = req.file as Express.Multer.File | undefined;
        if (!text && !file) {
            return res.status(400).json({
                success: false,
                message: "Message text or image is required",
            });
        }

        let chat = await Chat.findOne({
            $or: [
                { participant1: sender._id, participant2: receiver._id },
                { participant1: receiver._id, participant2: sender._id },
            ],
        } as any);

        if (!chat) {
            chat = await Chat.create({
                participant1: sender._id,
                participant2: receiver._id,
            } as any);
        }

        let imageUrl: string | undefined;
        if (file) {
            const blob = await put(`messages/${file.originalname}`, file.buffer, {
                access: "public",
                addRandomSuffix: true,
                contentType: file.mimetype,
            });
            imageUrl = blob.url;
        }

        const result = sendMessageSchema.safeParse({ text: text || undefined, image: imageUrl });
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: flattenError(result.error).fieldErrors,
            });
        }

        const message = await Message.create({
            chat: chat._id,
            sender: sender._id,
            receiver: receiver._id,
            text: result.data.text,
            image: result.data.image,
            isRead: false,
        } as any);

        const payload = {
            _id: message._id.toString(),
            chat: chat._id.toString(),
            sender: sender._id.toString(),
            receiver: receiver._id.toString(),
            text: message.text,
            image: message.image,
            createdAt: message.createdAt,
        };

        io.to(sender._id.toString()).emit("message:new", payload);
        io.to(receiver._id.toString()).emit("message:new", payload);

        chat.lastMessage = message._id as any;
        const receiverIdString = receiver._id.toString();
        if (chat.participant1?.toString() === receiverIdString) {
            chat.unreadCountP1 = (chat.unreadCountP1 || 0) + 1;
        } else if (chat.participant2?.toString() === receiverIdString) {
            chat.unreadCountP2 = (chat.unreadCountP2 || 0) + 1;
        }
        await chat.save();

        const receiverUnreadCount = chat.participant1?.toString() === receiver._id.toString() ? chat.unreadCountP1 || 0 : chat.unreadCountP2 || 0;

        io.to(receiver._id.toString()).emit("unread:update", { chatId: chat._id.toString(), unreadCount: receiverUnreadCount });

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
        });
    } catch (error: unknown) {
        console.error("SEND MESSAGE ERROR:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return res.status(500).json({ success: false, message });
    }
}
