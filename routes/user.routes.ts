import { Router } from "express";
import { register, login, getAllUsers, getCurrentUser, editProfile, getUserById } from "../controllers/user.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

const router = Router();

// prefix => /api/users
router.get("/", authMiddleware, getAllUsers);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/:id", authMiddleware, getUserById);

router.post("/register", register);
router.post("/login", login);
router.patch("/", authMiddleware, editProfile);
// router.delete("/", deleteUser);

export default router;
