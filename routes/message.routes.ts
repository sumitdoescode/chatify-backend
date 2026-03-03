import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { sendMessage } from "../controllers/message.controller.ts";
import { uploadMessageImage } from "../middleware/upload.middleware.ts";

const router = Router();

router.use(authMiddleware);

// prefix => /api/messages
router.post("/:id", uploadMessageImage.single("image"), sendMessage); // id => receiver user id

export default router;
