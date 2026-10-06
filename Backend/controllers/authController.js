import bcrypt from "bcryptjs";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { SessionModel, UserModel } from "../models/authModels.js";
import { hashSessionToken, readSessionToken } from "../middleware/requireAuth.js";

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDurationMs
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
});

const createSession = async (user, res) => {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + sessionDurationMs);

    await SessionModel.create({
        userId: user._id,
        tokenHash: hashSessionToken(token),
        expiresAt
    });

    res.cookie("campus_session", token, cookieOptions);
    return publicUser(user);
};

export const register = async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (name.length < 2 || name.length > 80) {
        return res.status(400).json({ success: false, message: "Name must be between 2 and 80 characters." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters and no more than 72 bytes." });
    }

    try {
        const existingUser = await UserModel.exists({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await UserModel.create({ name, email, passwordHash });
        const account = await createSession(user, res);

        res.status(201).json({ success: true, message: "Account created. Welcome to CampusConnect.", user: account });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }
        res.status(500).json({ success: false, message: "Unable to create your account right now." });
    }
};

const authenticate = async (req, res, acceptedRoles) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Enter your email and password." });
    }

    try {
        if (acceptedRoles.includes("admin")) {
            const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
            const configuredAdminPassword = process.env.ADMIN_PASSWORD;
            if (!configuredAdminEmail || !configuredAdminPassword) {
                return res.status(503).json({ success: false, message: "Admin sign-in is not configured." });
            }

            const user = await UserModel.findOne({ email: configuredAdminEmail });
            const submitted = Buffer.from(password);
            const expected = Buffer.from(configuredAdminPassword);
            const passwordMatches = submitted.length === expected.length && timingSafeEqual(submitted, expected);

            if (email !== configuredAdminEmail || !user || user.role !== "admin" || !passwordMatches) {
                return res.status(401).json({ success: false, message: "Email or password is incorrect." });
            }

            const account = await createSession(user, res);
            return res.json({ success: true, message: "Signed in successfully.", user: account });
        }

        const user = await UserModel.findOne({ email }).select("+passwordHash");
        const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

        if (!passwordMatches || !acceptedRoles.includes(user.role)) {
            return res.status(401).json({ success: false, message: "Email or password is incorrect." });
        }

        const account = await createSession(user, res);
        res.json({ success: true, message: "Signed in successfully.", user: account });
    } catch {
        res.status(500).json({ success: false, message: "Unable to sign in right now." });
    }
};

export const login = (req, res) => authenticate(req, res, ["student"]);

export const adminLogin = (req, res) => authenticate(req, res, ["admin"]);

export const currentUser = async (req, res) => {
    try {
        const token = readSessionToken(req);
        if (!token) {
            return res.json({ success: true, user: null });
        }

        const session = await SessionModel.findOne({
            tokenHash: hashSessionToken(token),
            expiresAt: { $gt: new Date() }
        }).populate("userId");

        res.json({ success: true, user: session?.userId ? publicUser(session.userId) : null });
    } catch {
        res.status(500).json({ success: false, message: "Unable to restore your session." });
    }
};

export const logout = async (req, res) => {
    const token = readSessionToken(req);
    if (token) {
        await SessionModel.deleteOne({ tokenHash: hashSessionToken(token) });
    }

    res.clearCookie("campus_session", { ...cookieOptions, maxAge: undefined });
    res.json({ success: true, message: "Signed out successfully." });
};
