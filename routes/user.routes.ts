import { Router } from "express";
import { register, login, getAllUsers, getCurrentUser, editProfile, getUserById, getUserMessages, uploadProfileImage } from "../controllers/user.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { uploadProfileImage as uploadProfileImageMiddleware } from "../middleware/upload.middleware.ts";

const router = Router();

// prefix => /api/users
router.get("/", authMiddleware, getAllUsers);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/:id/messages", authMiddleware, getUserMessages);
router.get("/:id", authMiddleware, getUserById);

router.post("/register", register);
router.post("/login", login);
router.post("/profile-image", authMiddleware, uploadProfileImageMiddleware.single("profileImage"), uploadProfileImage);
router.patch("/", authMiddleware, editProfile);
// router.delete("/", deleteUser);

export default router;
