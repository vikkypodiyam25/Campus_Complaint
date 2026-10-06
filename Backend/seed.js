import mongoose from "mongoose";
import { complaints as complaintsData } from "./data/complaints.js";
import ComplaintModel from "./models/userModels.js";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusconnect";

export const connectToDatabase = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return true;
        }

        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log("MongoDB Connected successfully via Mongoose...");
        return true;
    } catch (error) {
        console.warn("MongoDB is not available. Falling back to in-memory complaint data.", error.message);
        return false;
    }
};

export const seedDemoData = async () => {
    const isConnected = await connectToDatabase();

    if (!isConnected) {
        return [];
    }

    try {
        const existingCount = await ComplaintModel.countDocuments();

        if (existingCount > 0) {
            return [];
        }

        const result = await ComplaintModel.insertMany(complaintsData);
        console.log(`${result.length} demo complaints inserted into MongoDB.`);
        return result;
    } catch (error) {
        console.warn("Unable to seed MongoDB, using app fallback instead:", error.message);
        return [];
    }
};

export default seedDemoData;
