import { Chat } from "../models/Chat.model";
import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Message } from "../models/Message.model";
import mongoose from "mongoose";
import type { IMessage } from "../models/Message.model";
import { del } from "@vercel/blob";
import { User } from "../models/User.model";

// POST => /api/chats/resolve
export async function resolveChat(req: Request, res: Response) {
    try {
        const loggedInUser = req.user;
        const { userId } = req.body as { userId?: string };

        if (!loggedInUser?._id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        if (loggedInUser._id.toString() === userId) {
            return res.status(400).json({ success: false, message: "Cannot create chat with yourself" });
        }

        const targetUser = await User.findById(userId).select("_id");
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let chat = await Chat.findOne({
            $or: [
                { participant1: loggedInUser._id, participant2: userId },
                { participant1: userId, participant2: loggedInUser._id },
            ],
        } as any);

        let isNew = false;
        if (!chat) {
            chat = await Chat.create({
                participant1: loggedInUser._id,
                participant2: userId,
            } as any);
            isNew = true;
        }

        return res.status(200).json({
            success: true,
            message: "Chat resolved successfully",
            isNew,
            chatId: chat._id,
            chat,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("RESOLVE CHAT ERROR:", error);
        return res.status(500).json({ success: false, message });
    }
}

// GET => /api/chats
export async function getAllChats(req: Request, res: Response) {
    try {
        const loggedInUser = req.user;
        const chats = await Chat.aggregate([
            {
                $match: {
                    $or: [{ participant1: loggedInUser?._id }, { participant2: loggedInUser?._id }],
                },
            },
            {
                $addFields: {
                    otherParticipant: {
                        $cond: {
                            if: { $eq: ["$participant1", loggedInUser?._id] },
                            then: "$participant2",
                            else: "$participant1",
                        },
                    },
                    unreadCount: {
                        $cond: {
                            if: { $eq: ["$participant1", loggedInUser?._id] },
                            then: { $ifNull: ["$unreadCountP1", 0] },
                            else: { $ifNull: ["$unreadCountP2", 0] },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "otherParticipant",
                    foreignField: "_id",
                    as: "otherParticipant",
                    pipeline: [{ $project: { name: 1, email: 1, profileImage: 1 } }],
                },
            },
            {
                $unwind: {
                    path: "$otherParticipant",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "lastMessage",
                    foreignField: "_id",
                    as: "lastMessage",
                    pipeline: [{ $project: { _id: 0, text: 1, image: 1, createdAt: 1 } }],
                },
            },
            {
                $unwind: {
                    path: "$lastMessage",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    name: "$otherParticipant.name",
                    email: "$otherParticipant.email",
                    otherParticipantId: "$otherParticipant._id",
                    profileImage: "$otherParticipant.profileImage",
                    lastMessage: "$lastMessage",
                    createdAt: "$lastMessage.createdAt",
                    unreadCount: 1,
                },
            },
        ]);

        const chatsWithPreview = chats.map((chat: any) => {
            const text = typeof chat?.lastMessage?.text === "string" ? chat.lastMessage.text.trim() : "";
            const image = typeof chat?.lastMessage?.image === "string" ? chat.lastMessage.image.trim() : "";
            const isImageOnly = Boolean(image) && !text;

            return {
                ...chat,
                lastMessage: text || (isImageOnly ? "Image" : ""),
                lastMessageIsImage: isImageOnly,
            };
        });

        return res.status(200).json({
            success: true,
            message: "Chats fetched successfully",
            chats: chatsWithPreview,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        console.error("GET ALL CHATS ERROR:", error);
        return res.status(500).json({ success: false, message });
    }
}

// GET => /api/chats/:id
export async function getChatById(req: Request, res: Response) {
    try {
        const chatId = req.params.id;
        const loggedInUser = req.user;

        if (!isValidObjectId(chatId)) {
            return res.status(400).json({ success: false, message: "Invalid Chat id" });
        }

        const chat = await Chat.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(chatId as any),
                    $or: [{ participant1: loggedInUser?._id }, { participant2: loggedInUser?._id }],
                },
            },
            {
                $addFields: {
                    otherParticipant: {
                        $cond: {
                            if: { $eq: ["$participant1", loggedInUser?._id] },
                            then: "$participant2",
                            else: "$participant1",
                        },
                    },
                    unreadCount: {
                        $cond: {
                            if: { $eq: ["$participant1", loggedInUser?._id] },
                            then: { $ifNull: ["$unreadCountP1", 0] },
                            else: { $ifNull: ["$unreadCountP2", 0] },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "otherParticipant",
                    foreignField: "_id",
                    as: "otherParticipant",
                    pipeline: [{ $project: { name: 1, email: 1, profileImage: 1 } }],
                },
            },
            {
                $unwind: {
                    path: "$otherParticipant",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "lastMessage",
                    foreignField: "_id",
                    as: "lastMessage",
                    pipeline: [{ $project: { _id: 0, text: 1, image: 1, createdAt: 1 } }],
                },
            },
            {
                $unwind: {
                    path: "$lastMessage",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    otherParticipant: 1,
                    lastMessage: 1,
                    unreadCount: 1,
                },
            },
        ]);

        if (!chat.length) {
            return res.status(404).json({ success: false, message: "Chat not found or access denied" });
        }

        return res.status(200).json({
            success: true,
            message: "Chat fetched successfully",
            chat: chat[0],
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        console.error("GET CHAT BY ID ERROR:", error);
        return res.status(500).json({ success: false, message });
    }
}

// GET => /api/chats/:id/messages
export async function getChatMessages(req: Request, res: Response) {
    try {
        const loggedInUser = req.user;
        const chatId = req.params.id;

        if (!chatId || !isValidObjectId(chatId)) {
            return res.status(400).json({ success: false, message: "Invalid chat ID" });
        }

        const page = Math.max(1, Number(req.query.page) || 1); // default value = 1, min value = 1
        const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 50)); // default value = 50, min value = 10, max value = 100
        const skip = (page - 1) * limit;

        const chatExists = await Chat.findOne({
            _id: chatId,
            $or: [{ participant1: loggedInUser?._id }, { participant2: loggedInUser?._id }],
        } as any);

        if (!chatExists) {
            return res.status(404).json({ success: false, message: "Chat not found or access denied" });
        }

        await Message.updateMany({ chat: chatId, receiver: loggedInUser?._id, isRead: false } as any, { $set: { isRead: true, readAt: new Date() } } as any);

        if (chatExists.participant1?.toString() === loggedInUser?._id?.toString()) {
            chatExists.unreadCountP1 = 0;
        } else if (chatExists.participant2?.toString() === loggedInUser?._id?.toString()) {
            chatExists.unreadCountP2 = 0;
        }
        await chatExists.save();

        const messages = (await Message.find({ chat: chatId } as any)
            .select("-chat")
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean()) as IMessage[];

        const total = await Message.countDocuments({ chat: chatId } as any);
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            messages,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("GET CHAT MESSAGES ERROR:", error);
        return res.status(500).json({ success: false, message });
    }
}

// PATCH => /api/chats/:id/read
export async function markChatAsRead(req: Request, res: Response) {
    try {
        const loggedInUser = req.user;
        const { id } = req.params;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid chat ID" });
        }

        const chat = await Chat.findOne({
            _id: id,
            $or: [{ participant1: loggedInUser?._id }, { participant2: loggedInUser?._id }],
        } as any);

        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found or access denied" });
        }

        await Message.updateMany({ chat: id, receiver: loggedInUser?._id, isRead: false } as any, { $set: { isRead: true, readAt: new Date() } } as any);

        if (chat.participant1?.toString() === loggedInUser?._id?.toString()) {
            chat.unreadCountP1 = 0;
        } else if (chat.participant2?.toString() === loggedInUser?._id?.toString()) {
            chat.unreadCountP2 = 0;
        }

        await chat.save();

        return res.status(200).json({
            success: true,
            message: "Chat marked as read",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("MARK CHAT AS READ ERROR:", error);
        return res.status(500).json({ success: false, message });
    }
}

// DELETE => /api/chats/:id
export async function deleteChat(req: Request, res: Response) {
    try {
        const loggedInUser = req.user;
        const { id } = req.params;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid Chat id" });
        }

        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        const isDeleted = await Chat.findOneAndDelete({
            _id: chat._id,
            $or: [{ participant1: loggedInUser?._id }, { participant2: loggedInUser?._id }],
        } as any);

        if (!isDeleted) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const messageImages = await Message.find({ chat: chat._id, image: { $exists: true, $ne: "" } } as any)
            .select("image -_id")
            .lean();
        const imageUrls = messageImages.map((message: any) => message.image).filter(Boolean);
        // array of imageUrls

        if (imageUrls.length) {
            try {
                await del(imageUrls);
            } catch (blobError) {
                console.error("BLOB DELETE ERROR:", blobError);
            }
        }

        await Message.deleteMany({ chat: chat._id } as any);
        return res.status(200).json({
            success: true,
            message: "Chat deleted successfully",
        });
    } catch (error: unknown) {
        console.error("DELETE CHAT ERROR:", error);
        const message = error instanceof Error ? error.message : "Something went wrong";
        return res.status(500).json({ success: false, message });
    }
}
