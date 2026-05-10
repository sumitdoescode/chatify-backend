import type { Request, Response } from "express";
import { sendMessageSchema } from "../schemas/message.schema";
import { flattenError } from "zod";
import { isValidObjectId } from "mongoose";
import { Message } from "../models/Message.model";
import { Chat } from "../models/Chat.model";
import { put } from "@vercel/blob";
import { io } from "../server";
import { getDB } from "../lib/db";
import { ObjectId } from "mongodb";

// POST => /api/messages/:id , id => receiver user id
export async function sendMessage(req: Request, res: Response) {
    try {
        const senderId = req.user?.id;
        const receiverId = typeof req.params.id === "string" ? req.params.id : "";
        const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
        const file = req.file as Express.Multer.File | undefined;

        if (!senderId || !ObjectId.isValid(senderId)) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!isValidObjectId(receiverId)) {
            return res.status(400).json({ success: false, message: "Invalid receiver ID" });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: "Cannot send message to yourself" });
        }

        if (!text && !file) {
            return res.status(400).json({
                success: false,
                message: "Message text or image is required",
            });
        }

        const senderObjectId = new ObjectId(senderId);
        const receiverObjectId = new ObjectId(receiverId);

        const db = getDB();
        if (!db) {
            return res.status(500).json({ success: false, message: "Database connection failed" });
        }

        const receiverExists = await db.collection("user").findOne({ _id: receiverObjectId }, { projection: { _id: 1 } });
        if (!receiverExists) {
            return res.status(404).json({ success: false, message: "Receiver not found" });
        }

        let chat = await Chat.findOne({
            $or: [
                { participant1: senderObjectId, participant2: receiverObjectId },
                { participant1: receiverObjectId, participant2: senderObjectId },
            ],
        } as any);

        if (!chat) {
            chat = await Chat.create({
                participant1: senderObjectId,
                participant2: receiverObjectId,
            } as any);
        }

        const imageUrl = file
            ? (
                  await put(`messages/${file.originalname}`, file.buffer, {
                      access: "public",
                      addRandomSuffix: true,
                      contentType: file.mimetype,
                  })
              ).url
            : undefined;

        const result = sendMessageSchema.safeParse({ text: text || undefined, image: imageUrl });
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: flattenError(result.error).fieldErrors,
            });
        }

        const message = await Message.create({
            chat: chat._id,
            sender: senderObjectId,
            receiver: receiverObjectId,
            text: result.data.text,
            image: result.data.image,
            isRead: false,
        } as any);

        const chatId = chat._id.toString();
        const receiverSocketRoom = receiverId;
        const payload = {
            _id: message._id.toString(),
            chat: chatId,
            sender: senderId,
            receiver: receiverId,
            text: message.text,
            image: message.image,
            createdAt: message.createdAt,
        };

        io.to(senderId).emit("message:new", payload);
        io.to(receiverSocketRoom).emit("message:new", payload);

        chat.lastMessage = message._id as any;
        if (chat.participant1?.toString() === receiverId) {
            chat.unreadCountP1 = (chat.unreadCountP1 || 0) + 1;
        } else if (chat.participant2?.toString() === receiverId) {
            chat.unreadCountP2 = (chat.unreadCountP2 || 0) + 1;
        }
        await chat.save();

        const receiverUnreadCount = chat.participant1?.toString() === receiverId ? chat.unreadCountP1 || 0 : chat.unreadCountP2 || 0;

        io.to(receiverSocketRoom).emit("unread:update", { chatId, unreadCount: receiverUnreadCount });

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
    }
}
