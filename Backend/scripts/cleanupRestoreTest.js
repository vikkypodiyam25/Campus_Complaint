import "dotenv/config";
import mongoose from "mongoose";
import { SessionModel, UserModel } from "../models/authModels.js";

const email = "combined.restore.1790930704771@example.test";

try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await UserModel.findOne({ email }).select("_id");
    if (user) {
        await SessionModel.deleteMany({ userId: user._id });
        await UserModel.deleteOne({ _id: user._id });
    }
    console.log(`Removed temporary combined-dashboard test account: ${user ? email : "already absent"}`);
} finally {
    await mongoose.disconnect();
}
