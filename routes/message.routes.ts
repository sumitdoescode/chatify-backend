import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { sendMessage } from "../controllers/message.controller";

const router = Router();

router.use(authMiddleware);

// prefix => /api/messages
router.post("/:id", sendMessage); // id => receiver user id

export default router;
