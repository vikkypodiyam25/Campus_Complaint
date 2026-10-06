import express from "express";

import {
    getComplaints,
    getComplaintById,
    createComplaint,
    updateComplaintStatus,
    deleteComplaint,
    setComplaintVote
} from "../controllers/complaintController.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth, requireRole("student"));


// GET all complaints
router.get("/", getComplaints);


// GET single complaint
router.get("/:id", getComplaintById);


// CREATE complaint
router.post("/", createComplaint);


// UPDATE complaint status
router.put("/:id/status", updateComplaintStatus);

// One idempotent vote per signed-in student and complaint.
router.put("/:id/vote", setComplaintVote);


// DELETE complaint
router.delete("/:id", deleteComplaint);

export default router;
