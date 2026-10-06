import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ["student", "admin"], default: "student", required: true }
    },
    { timestamps: true, versionKey: false }
);

const sessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, index: true }
    },
    { versionKey: false }
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const SessionModel = mongoose.models.Session || mongoose.model("Session", sessionSchema);
