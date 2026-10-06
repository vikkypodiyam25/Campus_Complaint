
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import complaintRoutes from "./routes/complaintRoutes.js";
import adminComplaintRoutes from "./routes/adminComplaintRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectToDatabase, seedDemoData } from "./seed.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
// Render runs this service with Main_Project as its root directory. Allow an
// explicit path for other layouts, and retain the local sibling default.
const frontendBuildPath = path.resolve(
    backendDirectory,
    process.env.FRONTEND_BUILD_PATH || "../frontend/dist"
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        // Same-origin production requests do not need CORS. Keep local dev
        // origins and allow a separate frontend host when configured.
        origin: process.env.FRONTEND_URL
            ? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", process.env.FRONTEND_URL]
            : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        credentials: true
    })
);

app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,
        service: "CampusConnect API",
        status: databaseConnected ? "healthy" : "database unavailable",
        database: databaseConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/complaints", adminComplaintRoutes);
app.use("/api/complaints", complaintRoutes);

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

app.use(express.static(frontendBuildPath));
app.get("*", (req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    if (!req.accepts("html")) return next();
    res.sendFile(path.join(frontendBuildPath, "index.html"), (error) => {
        if (error) next(error);
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

app.use((error, req, res, next) => {
    console.error("SERVER ERROR:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

const startServer = async () => {
    try {
        const connected = await connectToDatabase();
        if (!connected) {
            throw new Error("MongoDB connection is required. Check MONGODB_URI and MongoDB Atlas Network Access.");
        }
        await seedDemoData();
    } catch (error) {
        console.error("Backend startup failed:", error.message);
        process.exit(1);
        return;
    }

    const server = app.listen(PORT, () => {
        console.log(`CampusConnect API running at http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use. Please stop the other server or change PORT in the .env file.`);
            process.exit(1);
        }

        console.error("Server startup error:", error);
        process.exit(1);
    });
};

startServer();
