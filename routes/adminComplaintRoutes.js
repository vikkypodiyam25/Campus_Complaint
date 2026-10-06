import express from "express";
import {
    getComplaints,
    getComplaintById,
    createComplaint,
    updateComplaintStatus,
    deleteComplaint
} from "../controllers/complaintController.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

// Every admin complaint operation requires a valid admin session.
router.use(requireAuth, requireRole("admin"));

router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.post("/", createComplaint);
router.put("/:id/status", updateComplaintStatus);
router.delete("/:id", deleteComplaint);

export default router;
