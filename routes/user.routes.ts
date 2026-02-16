import { Router } from "express";
import { signUp, login, getUser } from "../controllers/user.controller.ts";

const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/", getUser);
// router.delete("/", deleteUser);

export default router;
