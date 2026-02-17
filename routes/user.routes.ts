import { Router } from "express";
import { register, login, getAllUsers } from "../controllers/user.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

const router = Router();

// prefix => /api/users
router.post("/register", register);
router.post("/login", login);
router.get("/", authMiddleware, getAllUsers);
// router.delete("/", deleteUser);

export default router;
