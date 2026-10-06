import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { UserModel } from "../models/authModels.js";

dotenv.config();

const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const configuredPassword = process.env.ADMIN_PASSWORD;
const requestedEmail = process.argv[2]?.trim().toLowerCase();

if (!configuredEmail || !configuredPassword) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in Backend/.env first.");
    process.exit(1);
}

if (requestedEmail && requestedEmail !== configuredEmail) {
    console.error("The requested email must match ADMIN_EMAIL in Backend/.env.");
    process.exit(1);
}

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusconnect";

try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const passwordHash = await bcrypt.hash(configuredPassword, 12);
    const user = await UserModel.findOneAndUpdate(
        { email: configuredEmail },
        {
            $set: { role: "admin", passwordHash },
            $setOnInsert: { name: "Campus Administrator" }
        },
        { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select("name email role");

    console.log(`Admin account ready for ${user.email}. Sign in at /admin-login with ADMIN_PASSWORD.`);
} catch (error) {
    console.error("Unable to grant admin access:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
