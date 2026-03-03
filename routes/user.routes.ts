import { Router } from "express";
import { register, login, getAllUsers, getCurrentUser, uploadProfileImage } from "../controllers/user.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { uploadProfileImage as uploadProfileImageMiddleware } from "../middleware/upload.middleware.ts";

const router = Router();

// prefix => /api/users
router.get("/", authMiddleware, getAllUsers);
router.get("/me", authMiddleware, getCurrentUser);

router.post("/register", register);
router.post("/login", login);
router.post("/profile-image", authMiddleware, uploadProfileImageMiddleware.single("profileImage"), uploadProfileImage);

export default router;
