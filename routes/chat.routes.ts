import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getAllChats, getChatById, getChatMessages, deleteChat, markChatAsRead, resolveChat } from "../controllers/chat.controller";

const router = Router();

router.use(authMiddleware);

// prefix => /api/chats
router.post("/resolve", resolveChat); // body => { userId }
router.get("/", getAllChats); // get all chats
router.get("/:id/messages", getChatMessages); // id => chat id
router.get("/:id", getChatById); // id => chat id
router.patch("/:id/read", markChatAsRead); // id => chat id
router.delete("/:id", deleteChat); // id => chat id

export default router;
