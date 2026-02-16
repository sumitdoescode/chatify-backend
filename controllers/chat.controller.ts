import { User } from "../models/User.model";
import { Chat } from "../models/Chat.model";
import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Message } from "../models/Message.model";
import mongoose from "mongoose";
import type { IMessage } from "../models/Message.model";

// GET => /api/chats
export async function getAllChats(req: Request, res: Response) {
    try {
        const loggedInUser = (req as any).user;
        // const chats = await Chat.find({
        //     $or: [{ participant1: loggedInUser._id }, { participant2: loggedInUser._id }],
        // })
        //     .populate({
        //         path: "participant1",
        //         select: "name email profileImage",
        //     })
        //     .populate({
        //         path: "participant2",
        //         select: "name email profileImage",
        //     })
        //     .populate({
        //         path: "lastMessage",
        //         select: "text image",
        //     });
        const chats = await Chat.aggregate([
            {
                $match: {
                    $or: [{ participant1: loggedInUser._id }, { participant2: loggedInUser._id }],
                },
            },
            {
                $addFields: {
                    otherParticipant: {
                        $cond: {
                            if: {
                                $eq: ["$participant1", loggedInUser._id],
                            },
                            then: "$participant2",
                            else: "$participant1",
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
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                email: 1,
                                profileImage: 1,
                            },
                        },
                    ],
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
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                text: 1,
                                image: 1,
                                createdAt: 1,
                            },
                        },
                    ],
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
                },
            },
        ]);
        return res.status(200).json({
            success: true,
            message: "Chats fetched successfully",
            chats,
        });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message || "Something went wrong",
            });
        }
    }
}

// get chat by id
// GET => /api/chats/:id
export async function getChatById(req: Request, res: Response) {
    try {
        const chatId = req.params.id;
        const loggedInUser = (req as any).user;
        if (!isValidObjectId(chatId)) {
            return res.status(400).json({ success: false, message: "Invalid Chat id" });
        }

        const chat = await Chat.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(chatId as any),
                    $or: [{ participant1: loggedInUser._id }, { participant2: loggedInUser._id }],
                },
            },
            {
                $addFields: {
                    otherParticipant: {
                        $cond: {
                            if: {
                                $eq: ["$participant1", loggedInUser._id],
                            },
                            then: "$participant2",
                            else: "$participant1",
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
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                email: 1,
                                profileImage: 1,
                            },
                        },
                    ],
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
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                text: 1,
                                image: 1,
                                createdAt: 1,
                            },
                        },
                    ],
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
    } catch (error) {
        if (error instanceof Error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message || "Something went wrong",
            });
        }
    }
}

// get messages of a chat
// GET => /api/chats/:id/messages
export async function getChatMessages(req: Request, res: Response) {
    console.log("coming here!!s");
    try {
        const loggedInUser = (req as any).user;
        const chatId = req.params.id;
        if (!chatId || !isValidObjectId(chatId)) {
            return res.status(400).json({ success: false, message: "Invalid chat ID" });
        }

        let { page = 1, limit = 50 } = req.query;
        page = Number(page);
        limit = Number(limit);
        if (page < 1) page = 1;
        if (limit > 100) limit = 100;
        const skip = (page - 1) * limit;

        const chatExists = await Chat.findOne({
            _id: chatId,
            $or: [{ participant1: loggedInUser._id }, { participant2: loggedInUser._id }],
        });

        if (!chatExists) {
            return res.status(404).json({ success: false, message: "Chat not found or access denied" });
        }

        const messages = (await Message.find({ chat: chatId } as any)
            .select("-chat")
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean()) as IMessage[];

        const total = await Message.countDocuments({ chat: chatId } as any);

        return res.status(200).json({
            success: true,
            messages,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: messages.length === limit,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error);
            return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
        }
    }
}

// delete chat by id
// DELETE => /api/chats/:id
export async function deleteChat(req: Request, res: Response) {
    try {
        const loggedInUser = (req as any).user;
        const { id } = req.params;
        console.log(id);
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid Chat id" });
        }

        const chat = await Chat.findById(id);

        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        const isDeleted = await Chat.findOneAndDelete({
            _id: chat._id,
            $or: [{ participant1: loggedInUser._id }, { participant2: loggedInUser._id }],
        });
        if (!isDeleted) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        // delete all messages of this chat
        await Message.deleteMany({ chat: chat._id });
        return res.status(200).json({
            success: true,
            message: "Chat deleted successfully",
        });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message || "Something went wrong",
            });
        }
    }
}
