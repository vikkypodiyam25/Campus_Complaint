import mongoose from "mongoose";
import ComplaintModel from "../models/userModels.js";

const allowedStatuses = ["Pending", "In Progress", "Resolved"];
const allowedPriorities = ["Low", "Medium", "High", "Critical"];
const allowedCategories = ["Internet", "Laptop", "Classroom", "Electricity", "Facilities", "Account"];

function createId() {
    return `CC-${Math.floor(1000 + Math.random() * 9000)}`;
}

function validateComplaint(body) {
    const errors = [];

    if (!body.studentName || body.studentName.trim().length < 2) {
        errors.push("studentName is required and must contain at least 2 characters");
    }

    if (!body.title || body.title.trim().length < 5) {
        errors.push("title is required and must contain at least 5 characters");
    }

    if (!body.description || body.description.trim().length < 10) {
        errors.push("description is required and must contain at least 10 characters");
    }

    if (!body.category || !allowedCategories.includes(body.category)) {
        errors.push(`category must be one of: ${allowedCategories.join(", ")}`);
    }

    if (!body.priority || !allowedPriorities.includes(body.priority)) {
        errors.push(`priority must be one of: ${allowedPriorities.join(", ")}`);
    }

    return errors;
}

const matchId = (value) => {
    if (mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value) {
        return { _id: new mongoose.Types.ObjectId(value) };
    }

    return {
        $or: [
            { id: value },
            { complaintId: value }
        ]
    };
};

const requireDatabase = (res) => {
    if (mongoose.connection.readyState === 1) return false;

    res.status(503).json({
        success: false,
        message: "MongoDB is unavailable. This operation was not saved."
    });
    return true;
};

const presentComplaint = (complaint, userId) => {
    const item = complaint.toObject ? complaint.toObject() : { ...complaint };
    const votes = Array.isArray(item.votes) ? item.votes : [];
    delete item.votes;

    return {
        ...item,
        voteCount: votes.length,
        hasVoted: Boolean(userId && votes.some((voterId) => String(voterId) === String(userId)))
    };
};

export const getComplaints = async (req, res) => {
    try {
        if (requireDatabase(res)) return;

        const { status, category, priority, search } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        if (search) {
            const query = String(search).trim();
            filter.$or = [
                { title: { $regex: query, $options: "i" } },
                { studentName: { $regex: query, $options: "i" } },
                { id: { $regex: query, $options: "i" } },
                { complaintId: { $regex: query, $options: "i" } }
            ];
        }

        const complaints = await ComplaintModel.find(filter).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: complaints.length,
            data: complaints.map((complaint) => presentComplaint(complaint, req.user?._id))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getComplaintById = async (req, res) => {
    try {
        if (requireDatabase(res)) return;

        const complaint = await ComplaintModel.findOne(matchId(req.params.id));

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        res.json({ success: true, data: presentComplaint(complaint, req.user?._id) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createComplaint = async (req, res) => {
    try {
        if (requireDatabase(res)) return;

        const errors = validateComplaint(req.body);

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed", errors });
        }

        const complaintId = createId();
        const complaintPayload = {
            id: complaintId,
            complaintId,
            studentName: req.body.studentName.trim(),
            studentId: req.body.studentId?.trim() || "NOT-PROVIDED",
            category: req.body.category,
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            priority: req.body.priority,
            status: "Pending",
            location: req.body.location?.trim() || "Not provided",
            createdAt: new Date().toISOString()
        };

        const complaint = await ComplaintModel.create({
            ...complaintPayload,
            createdAt: new Date()
        });

        res.status(201).json({ success: true, message: "Complaint created successfully", data: presentComplaint(complaint, req.user?._id) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateComplaintStatus = async (req, res) => {
    try {
        if (requireDatabase(res)) return;

        const { status } = req.body;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Use: ${allowedStatuses.join(", ")}` });
        }

        const complaint = await ComplaintModel.findOneAndUpdate(matchId(req.params.id), { status }, { new: true });

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        res.json({ success: true, message: "Complaint status updated", data: presentComplaint(complaint, req.user?._id) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteComplaint = async (req, res) => {
    try {
        if (requireDatabase(res)) return;

        const complaint = await ComplaintModel.findOneAndDelete(matchId(req.params.id));

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        res.json({ success: true, message: "Complaint deleted", data: presentComplaint(complaint, req.user?._id) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const setComplaintVote = async (req, res) => {
    try {
        if (requireDatabase(res)) return;

        if (typeof req.body?.vote !== "boolean") {
            return res.status(400).json({ success: false, message: "vote must be true or false." });
        }

        const update = req.body.vote
            ? { $addToSet: { votes: req.user._id } }
            : { $pull: { votes: req.user._id } };
        const complaint = await ComplaintModel.findOneAndUpdate(
            matchId(req.params.id),
            update,
            { returnDocument: "after" }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        res.json({
            success: true,
            message: req.body.vote ? "Your support was added." : "Your support was removed.",
            data: presentComplaint(complaint, req.user._id)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
