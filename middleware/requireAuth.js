import { createHash } from "node:crypto";
import { SessionModel } from "../models/authModels.js";

const cookieName = "campus_session";

export const readSessionToken = (req) => {
    const cookieHeader = req.headers.cookie || "";
    const sessionCookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));

    if (!sessionCookie) return null;

    try {
        return decodeURIComponent(sessionCookie.slice(cookieName.length + 1));
    } catch {
        return null;
    }
};

export const hashSessionToken = (token) => createHash("sha256").update(token).digest("hex");

export const requireAuth = async (req, res, next) => {
    try {
        const token = readSessionToken(req);
        if (!token) {
            return res.status(401).json({ success: false, message: "Please sign in to continue." });
        }

        const session = await SessionModel.findOne({
            tokenHash: hashSessionToken(token),
            expiresAt: { $gt: new Date() }
        }).populate("userId");

        if (!session?.userId) {
            return res.status(401).json({ success: false, message: "Your session expired. Please sign in again." });
        }

        req.user = session.userId;
        req.sessionTokenHash = session.tokenHash;
        next();
    } catch (error) {
        next(error);
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "You do not have permission to perform this action." });
    }

    next();
};