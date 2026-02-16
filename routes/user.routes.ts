import { Router } from "express";
import { signUp, login, getAllUsers } from "../controllers/user.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

const router = Router();

// prefix => /api/users
router.post("/signup", signUp);
router.post("/login", login);
router.get("/", authMiddleware, getAllUsers);
// router.delete("/", deleteUser);

export default router;
