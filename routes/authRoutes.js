import express from "express";
import { adminLogin, currentUser, login, logout, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.get("/me", currentUser);
router.post("/logout", logout);

export default router;