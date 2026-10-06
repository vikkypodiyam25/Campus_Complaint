import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const campusImages = [
    "https://d3lzcn6mbbadaf.cloudfront.net/media/details/ANI-20250711065830.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMyuUY1NEKFqR5PzRD93oEybhnPQUUBq3MbTUx-mGw8Y6SU-_HkyfimUA&s=10",
    "https://i.ytimg.com/vi/UMvmVW5QUo4/hqdefault.jpg",
    "https://i.ytimg.com/vi/dVSsTDo3mnE/sddefault.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCCNiMJFYi14g8yeq3IPzmPGb1YFyniRrFRvG4OetsAYJAFA9C0Dn7OC9V&s=10",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXXIIA1a1gUL5DDoELLilZ3yK5WdvzbMc19OTS6NJ89n3GXYLGwIUtJgw&s=10",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLuQe5olMX-c8kevcbsDvfPIrEr3MIz6VGm0Cqxb6WCcKhGjmFizDsBVie&s=10"
];
const authImages = [
    "/images/campus-signin.jpg",
    "/images/campus-login-group.jpg",
    "/images/campus-login-third.jpg"
];

const normalizeComplaint = (item) => ({
    id: item.id || item.complaintId || item._id || "N/A",
    studentName: item.studentName || "Unknown student",
    category: item.category || "General",
    title: item.title || "Untitled complaint",
    description: item.description || "No description provided.",
    priority: item.priority || "Medium",
    status: item.status || "Pending",
    location: item.location || "Not provided",
    voteCount: Number(item.voteCount) || 0,
    hasVoted: Boolean(item.hasVoted)
});

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.message || "Request failed");
    }

    return payload;
}

function Navbar({ user, onLogout }) {
    return (
        <header className="navbar">
            <div className="nav-inner">
                <div className="logo">
                    <span className="logo-mark" aria-hidden="true"><i>CC</i></span>
                    <span className="logo-wordmark">
                        <strong>Campus<span>Connect</span></strong>
                        <small>Campus services, connected</small>
                    </span>
                </div>
                <div className="nav-tools">
                    <nav>
                        <a className="nav-link" href="#dashboard">Dashboard</a>
                        <a className="nav-link" href="#complaints">Complaints</a>
                        <a className="nav-link nav-link-action" href="#create"><span aria-hidden="true">+</span> New report</a>
                    </nav>
                    <div className="nav-account">
                        <span className="account-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                        <span className="account-name">{user.name}</span>
                        <button type="button" className="logout-button" onClick={onLogout}>Log out</button>
                    </div>
                </div>
            </div>
        </header>
    );
}

function AdminNavbar({ user, onLogout }) {
    return (
        <header className="navbar admin-navbar">
            <div className="nav-inner">
                <div className="logo">
                    <span className="logo-mark" aria-hidden="true"><i>CC</i></span>
                    <span className="logo-wordmark">
                        <strong>Campus<span>Connect</span></strong>
                        <small>Administration</small>
                    </span>
                </div>
                <div className="nav-tools">
                    <nav>
                        <a className="nav-link" href="#dashboard">Overview</a>
                        <a className="nav-link" href="#complaints">Complaint queue</a>
                    </nav>
                    <div className="nav-account">
                        <span className="account-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                        <span className="account-name">{user.name}</span>
                        <span className="role-label role-admin">ADMIN</span>
                        <button type="button" className="logout-button" onClick={onLogout}>Log out</button>
                    </div>
                </div>
            </div>
        </header>
    );
}

function StatCard({ label, value, helper, tone }) {
    return (
        <article className={`stat-card stat-${tone}`}>
            <div className="stat-card-top">
                <span>{label}</span>
                <i aria-hidden="true" />
            </div>
            <strong>{value}</strong>
            <small>{helper}</small>
        </article>
    );
}

function Dashboard({ complaints, adminMode = false }) {
    const [activeCampusImage, setActiveCampusImage] = useState(0);
    const counts = useMemo(() => {
        const pending = complaints.filter((item) => item.status === "Pending").length;
        const progress = complaints.filter((item) => item.status === "In Progress").length;
        const resolved = complaints.filter((item) => item.status === "Resolved").length;

        return {
            total: complaints.length,
            pending,
            progress,
            resolved,
            open: pending + progress,
            resolutionRate: complaints.length ? Math.round((resolved / complaints.length) * 100) : 0
        };
    }, [complaints]);
    const attentionItems = useMemo(() => complaints
        .filter((item) => item.status !== "Resolved" && ["High", "Critical"].includes(item.priority))
        .sort((first, second) => (first.priority === "Critical" ? -1 : 0) - (second.priority === "Critical" ? -1 : 0))
        .slice(0, 3), [complaints]);
    const statusRows = [
        { label: "Pending", value: counts.pending, className: "pending" },
        { label: "In progress", value: counts.progress, className: "progress" },
        { label: "Resolved", value: counts.resolved, className: "resolved" }
    ];

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveCampusImage((current) => (current + 1) % campusImages.length);
        }, 10000);

        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <section id="dashboard" className="dashboard">
            <div className="campus-hero">
                <div className="campus-slides" aria-hidden="true">
                    {campusImages.map((image, index) => (
                        <div
                            key={image}
                            className={`campus-slide${activeCampusImage === index ? " is-active" : ""}`}
                            style={{ backgroundImage: `url("${image}")` }}
                        />
                    ))}
                </div>
                <div className="campus-overlay" aria-hidden="true" />
                <div className="campus-content">
                    <div className="page-heading">
                        <div>
                            <span className="eyebrow">{adminMode ? "ADMIN OPERATIONS" : "STUDENT DASHBOARD"}</span>
                            <h1>{adminMode ? "Campus service desk" : "Campus issue control center"}</h1>
                            <p>{adminMode ? "Review incoming reports and coordinate campus resolutions." : "Track, search and manage reported campus issues."}</p>
                            <div className="hero-actions">
                                <a className="hero-button hero-button-primary" href="#complaints">{adminMode ? "Open complaint queue" : "View reports"} <span aria-hidden="true">↓</span></a>
                                {!adminMode && <a className="hero-button hero-button-secondary" href="#create">Report an issue <span aria-hidden="true">+</span></a>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="campus-controls" role="group" aria-label="Campus background photos">
                    {campusImages.map((image, index) => (
                        <button
                            key={image}
                            className={`campus-dot${activeCampusImage === index ? " is-active" : ""}`}
                            type="button"
                            aria-label={`Show campus photo ${index + 1}`}
                            aria-pressed={activeCampusImage === index}
                            onClick={() => setActiveCampusImage(index)}
                        >
                            <span />
                        </button>
                    ))}
                </div>
            </div>

            <div className="stats-grid">
                <StatCard label="Total reports" value={counts.total} helper="Across all categories" tone="total" />
                <StatCard label="Pending" value={counts.pending} helper="Awaiting attention" tone="pending" />
                <StatCard label="In progress" value={counts.progress} helper="Currently being handled" tone="progress" />
                <StatCard label="Resolved" value={counts.resolved} helper="Successfully completed" tone="resolved" />
            </div>

            <section className="operations-overview" aria-labelledby="operations-title">
                <div className="operations-heading">
                    <div>
                        <span className="eyebrow">LIVE OPERATIONS</span>
                        <h2 id="operations-title">Campus workload</h2>
                        <p>Current service desk activity across all reports.</p>
                    </div>
                    <div className="operations-summary">
                        <span className="live-indicator" />
                        <span>{counts.open} open {counts.open === 1 ? "issue" : "issues"}</span>
                    </div>
                </div>

                <div className="operations-grid">
                    <section className="status-breakdown" aria-labelledby="status-breakdown-title">
                        <div className="panel-heading">
                            <div>
                                <span className="panel-kicker">REPORT STATUS</span>
                                <h3 id="status-breakdown-title">Resolution overview</h3>
                            </div>
                            <div className="resolution-rate" style={{ "--rate": `${counts.resolutionRate}%` }} aria-label={`${counts.resolutionRate}% resolved`}>
                                <span>{counts.resolutionRate}%</span>
                            </div>
                        </div>
                        <div className="status-stack" aria-label="Report status distribution">
                            {counts.total > 0 ? statusRows.map((row) => (
                                <span
                                    key={row.label}
                                    className={`status-stack-segment is-${row.className}`}
                                    style={{ width: `${(row.value / counts.total) * 100}%` }}
                                />
                            )) : <span className="status-stack-empty" />}
                        </div>
                        <div className="status-breakdown-rows">
                            {statusRows.map((row) => (
                                <div className="status-breakdown-row" key={row.label}>
                                    <span className={`status-key is-${row.className}`} />
                                    <span className="status-row-label">{row.label}</span>
                                    <span className="status-row-value">{row.value}</span>
                                    <div className="status-row-track">
                                        <span className={`status-row-fill is-${row.className}`} style={{ width: `${counts.total ? (row.value / counts.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="attention-queue" aria-labelledby="attention-title">
                        <div className="panel-heading attention-heading">
                            <div>
                                <span className="panel-kicker">PRIORITY QUEUE</span>
                                <h3 id="attention-title">Needs attention</h3>
                            </div>
                            <span className="attention-count">{complaints.filter((item) => item.status !== "Resolved" && ["High", "Critical"].includes(item.priority)).length}</span>
                        </div>
                        {attentionItems.length ? (
                            <div className="attention-list">
                                {attentionItems.map((item) => (
                                    <a className="attention-item" href="#complaints" key={item.id}>
                                        <span className={`attention-priority is-${item.priority.toLowerCase()}`} aria-hidden="true">!</span>
                                        <span className="attention-copy">
                                            <strong>{item.title}</strong>
                                            <small>{item.id} <span>·</span> {item.location}</small>
                                        </span>
                                        <span className={`priority-tag is-${item.priority.toLowerCase()}`}>{item.priority}</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="attention-empty">
                                <span aria-hidden="true">✓</span>
                                <p>No urgent reports in the queue.</p>
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </section>
    );
}

function ComplaintForm({ onAdd }) {
    const [form, setForm] = useState({
        studentName: "",
        category: "",
        title: "",
        description: "",
        priority: "Medium",
        location: ""
    });

    const [message, setMessage] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.studentName.trim()) {
            setMessage("Please enter student name.");
            return;
        }

        if (!form.title.trim()) {
            setMessage("Please enter an issue title.");
            return;
        }

        if (!form.category) {
            setMessage("Please select a category.");
            return;
        }

        if (!form.description.trim()) {
            setMessage("Please describe the issue.");
            return;
        }

        try {
            const payload = await onAdd({ ...form, studentId: `ST-${Math.floor(1000 + Math.random() * 9000)}` });
            if (payload?.message) {
                setMessage(payload.message);
            }
            setForm({
                studentName: "",
                category: "",
                title: "",
                description: "",
                priority: "Medium",
                location: ""
            });
        } catch (error) {
            setMessage(error.message || "Unable to submit complaint right now.");
        }
    }

    return (
        <section id="create" className="create-section">
            <div className="section-title">
                <span className="eyebrow">NEW REPORT</span>
                <h2>Create a complaint</h2>
                <p>Use a clear title and useful description so the support team can act quickly.</p>
            </div>

            <form className="complaint-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <label>
                        Student name
                        <input
                            name="studentName"
                            value={form.studentName}
                            onChange={handleChange}
                            placeholder="Student Name..."
                        />
                    </label>

                    <label>
                        Category
                        <select name="category" value={form.category} onChange={handleChange}>
                            <option value="">Select category</option>
                            <option value="Internet">Internet</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Classroom">Classroom</option>
                            <option value="Electricity">Electricity</option>
                            <option value="Facilities">Facilities</option>
                            <option value="Account">Other</option>
                        </select>
                    </label>

                    <label>
                        Issue title
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="What is not working"
                        />
                    </label>

                    <label>
                        Location
                        <input
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Where...."
                        />
                    </label>

                    <label>
                        Priority
                        <select name="priority" value={form.priority} onChange={handleChange}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </label>

                    <label className="wide">
                        Description
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Explain what happened..."
                        />
                    </label>
                </div>

                {message && <div className="form-message">{message}</div>}

                <button className="primary-button" type="submit">
                    Submit Complaint
                </button>
            </form>
        </section>
    );
}

function SearchFilter({ search, setSearch, status, setStatus, category, setCategory }) {
    return (
        <div className="toolbar">
            <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, student or ID..."
            />

            <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
            </select>

            <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="All">All categories</option>
                <option value="Internet">Internet</option>
                <option value="Laptop">Laptop</option>
                <option value="Classroom">Classroom</option>
                <option value="Electricity">Electricity</option>
                <option value="Facilities">Facilities</option>
                <option value="Account">Others</option>
            </select>
        </div>
    );
}

function ComplaintCard({ complaint, onStatusChange, onDelete, onVote, adminMode = false }) {
    const urgent = complaint.priority === "High" || complaint.priority === "Critical";

    return (
        <article className="complaint-card">
            <div className="complaint-top">
                <div>
                    <span className="complaint-id">{complaint.id}</span>
                    <h3>{complaint.title}</h3>
                </div>
                <div className="complaint-status-group">
                    <span className={`priority priority-${complaint.priority.toLowerCase()}`}>{complaint.priority} priority</span>
                    <span className={`status status-${complaint.status.toLowerCase().replace(" ", "-")}`}>
                        {complaint.status}
                    </span>
                </div>
            </div>

            <p className="description">{complaint.description}</p>

            <div className="meta-grid">
                <span><b>Student:</b> {complaint.studentName}</span>
                <span><b>Category:</b> {complaint.category}</span>
                <span><b>Location:</b> {complaint.location || "Not provided"}</span>
                <span><b>Priority:</b> {complaint.priority}</span>
            </div>

            {urgent && (
                <div className="urgent-note">
                    ⚠ This complaint requires quick attention.
                </div>
            )}

            {!adminMode && (
                <div className="vote-row">
                    <button
                        type="button"
                        className={`vote-button${complaint.hasVoted ? " is-voted" : ""}`}
                        aria-pressed={complaint.hasVoted}
                        aria-label={`${complaint.hasVoted ? "Remove support from" : "Support"} complaint ${complaint.id}; ${complaint.voteCount} votes`}
                        onClick={() => onVote(complaint)}
                    >
                        <span aria-hidden="true">↑</span>
                        {complaint.hasVoted ? "Supported" : "Support this issue"}
                        <strong>{complaint.voteCount}</strong>
                    </button>
                    <span className="vote-caption">Student support</span>
                </div>
            )}

            {adminMode && (
                <div className="card-actions">
                    <select
                        aria-label={`Update status for ${complaint.id}`}
                        value={complaint.status}
                        onChange={(event) => onStatusChange(complaint.id, event.target.value)}
                    >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                    </select>

                    <button className="delete-button" onClick={() => onDelete(complaint.id)}>
                        Delete
                    </button>
                </div>
            )}
        </article>
    );
}

function ComplaintList({ complaints, onStatusChange, onDelete, onVote, adminMode = false }) {
    return (
        <section id="complaints" className="list-section">
            <div className="list-heading">
                <div className="section-title">
                    <span className="eyebrow">{adminMode ? "ADMIN SERVICE DESK" : "COMPLAINTS"}</span>
                    <h2>{adminMode ? "All campus complaints" : "Reported issues"}</h2>
                    <p>{adminMode ? "Review reports and update the resolution status." : "Review and manage reported campus issues."}</p>
                </div>
                <span className="report-count">{complaints.length} {complaints.length === 1 ? "report" : "reports"}</span>
            </div>

            {complaints.length === 0 ? (
                <div className="empty-state">
                    <h3>No complaints found</h3>
                    <p>Try changing your search or filters.</p>
                </div>
            ) : (
                <div className="complaint-list">
                    {complaints.map((complaint) => (
                        <ComplaintCard
                            key={complaint.id}
                            complaint={complaint}
                            onStatusChange={onStatusChange}
                            onDelete={onDelete}
                            onVote={onVote}
                            adminMode={adminMode}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function DashboardApp({ user, onLogout, adminMode = false }) {
    const [complaints, setComplaints] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadComplaints = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await apiRequest(adminMode ? "/admin/complaints" : "/complaints");
            const nextComplaints = Array.isArray(response?.data) ? response.data.map(normalizeComplaint) : [];
            setComplaints(nextComplaints);
        } catch (err) {
            setComplaints([]);
            setError(err.message || "Unable to load complaints from the API.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComplaints();
    }, []);

    async function addComplaint(newComplaint) {
        try {
            const requestBody = {
                ...newComplaint,
                location: newComplaint.location || "Not provided",
                priority: newComplaint.priority || "Medium"
            };

            const response = await apiRequest(adminMode ? "/admin/complaints" : "/complaints", {
                method: "POST",
                body: JSON.stringify(requestBody)
            });

            await loadComplaints();
            return response;
        } catch (err) {
            setError(err.message || "Unable to add complaint.");
            throw err;
        }
    }

    async function updateStatus(id, newStatus) {
        try {
            await apiRequest(`${adminMode ? "/admin/complaints" : "/complaints"}/${id}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus })
            });
            await loadComplaints();
        } catch (err) {
            setError(err.message || "Unable to update complaint status.");
        }
    }

    async function deleteComplaint(id) {
        try {
            await apiRequest(`${adminMode ? "/admin/complaints" : "/complaints"}/${id}`, {
                method: "DELETE"
            });
            await loadComplaints();
        } catch (err) {
            setError(err.message || "Unable to delete complaint.");
        }
    }

    async function voteForComplaint(complaint) {
        try {
            const response = await apiRequest(`/complaints/${encodeURIComponent(complaint.id)}/vote`, {
                method: "PUT",
                body: JSON.stringify({ vote: !complaint.hasVoted })
            });
            const updated = response.data;
            setComplaints((current) => current.map((item) => (
                item.id === complaint.id
                    ? { ...item, voteCount: updated.voteCount, hasVoted: updated.hasVoted }
                    : item
            )));
        } catch (err) {
            setError(err.message || "Unable to update your support right now.");
        }
    }

    const filteredComplaints = useMemo(() => {
        const query = search.toLowerCase().trim();

        return complaints.filter((item) => {
            const matchesSearch =
                item.title.toLowerCase().includes(query) ||
                item.studentName.toLowerCase().includes(query) ||
                item.id.toLowerCase().includes(query);

            const matchesStatus = status === "All" || item.status === status;
            const matchesCategory = category === "All" || item.category === category;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [complaints, search, status, category]);

    return (
        <>
            {adminMode ? <AdminNavbar user={user} onLogout={onLogout} /> : <Navbar user={user} onLogout={onLogout} />}

            <main className={`container${adminMode ? " admin-container" : ""}`}>
                <Dashboard complaints={complaints} adminMode={adminMode} />

                {error && <div className="form-message" style={{ marginBottom: "18px" }}>{error}</div>}

                <section className="filters-section">
                    <SearchFilter
                        search={search}
                        setSearch={setSearch}
                        status={status}
                        setStatus={setStatus}
                        category={category}
                        setCategory={setCategory}
                    />
                </section>

                {loading ? (
                    <div className="empty-state">
                        <h3>Loading complaints...</h3>
                    </div>
                ) : (
                    <ComplaintList
                        complaints={filteredComplaints}
                        onStatusChange={updateStatus}
                        onDelete={deleteComplaint}
                        onVote={voteForComplaint}
                        adminMode={adminMode}
                    />
                )}

                {!adminMode && <ComplaintForm onAdd={addComplaint} />}
            </main>

            <footer className="footer">
                CampusConnect · {adminMode ? "Administration" : "Campus services"}
            </footer>
        </>
    );
}

function AuthPage({ mode, onAuthenticated }) {
    const navigate = useNavigate();
    const isRegister = mode === "register";
    const isAdminLogin = mode === "admin-login";
    const [activeAuthImage, setActiveAuthImage] = useState(0);
    const rememberedEmailKey = isAdminLogin ? "campusconnect_admin_email" : "campusconnect_user_email";
    const [form, setForm] = useState(() => ({
        name: "",
        email: window.localStorage.getItem(rememberedEmailKey) || "",
        password: "",
        confirmPassword: ""
    }));
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveAuthImage((current) => (current + 1) % authImages.length);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, []);

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setError("");
    }

    async function submit(event) {
        event.preventDefault();
        setError("");

        if (isRegister && form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await apiRequest(`/auth/${mode}`, {
                method: "POST",
                body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
            });
            window.localStorage.setItem(rememberedEmailKey, form.email.trim().toLowerCase());
            onAuthenticated(response.user);
            navigate(response.user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
        } catch (requestError) {
            setError(requestError.message || "Unable to sign in right now.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-visual" aria-label="CampusConnect">
                {authImages.map((image, index) => (
                    <div
                        key={image}
                        className={`auth-visual-image${activeAuthImage === index ? " is-active" : ""}`}
                        style={{ backgroundImage: `url("${image}")` }}
                        aria-hidden="true"
                    />
                ))}
                <div className="auth-visual-shade" />
                <Link className="auth-brand" to="/login" aria-label="CampusConnect home">
                    <span className="logo-mark" aria-hidden="true"><i>CC</i></span>
                    <span className="logo-wordmark"><strong>Campus<span>Connect</span></strong><small>Campus services, connected</small></span>
                </Link>
                <div className="auth-story">
                    <span className="auth-kicker">YOUR CAMPUS, IN SYNC</span>
                    <h1>Make campus life work better.</h1>
                    <p>One place to report issues, follow progress and keep your campus moving.</p>
                    <div className="auth-image-credit"><span /> Campus community portal</div>
                </div>
            </section>

            <section className="auth-form-side">
                <div className="auth-mobile-brand">
                    <span className="logo-mark" aria-hidden="true"><i>CC</i></span>
                    <span className="logo-wordmark"><strong>Campus<span>Connect</span></strong><small>Campus services, connected</small></span>
                </div>
                <div className="auth-form-wrap">
                    <span className="auth-kicker auth-kicker-light">{isRegister ? "JOIN THE CAMPUS COMMUNITY" : isAdminLogin ? "AUTHORIZED STAFF ACCESS" : "WELCOME BACK"}</span>
                    <h2>{isRegister ? "Create your account" : isAdminLogin ? "Admin sign in" : "Sign in to your campus"}</h2>
                    <p className="auth-subtitle">{isRegister ? "Use your campus email to get started." : isAdminLogin ? "Sign in to review and process campus reports." : "Enter your account details to continue."}</p>

                    <form className="auth-form" onSubmit={submit}>
                        {isRegister && (
                            <label>
                                Full name
                                <input name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Your name" required minLength={2} maxLength={80} />
                            </label>
                        )}
                        <label>
                            Campus email
                            <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@campus.edu" required />
                        </label>
                        <label>
                            Password
                            <input name="password" type="password" value={form.password} onChange={updateField} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} required minLength={isRegister ? 8 : undefined} />
                        </label>
                        {isRegister && (
                            <label>
                                Confirm password
                                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" placeholder="Re-enter your password" required />
                            </label>
                        )}
                        {error && <div className="auth-error" role="alert">{error}</div>}
                        <button className="auth-submit" type="submit" disabled={submitting}>
                            {submitting ? "Please wait..." : isRegister ? "Create account" : isAdminLogin ? "Admin sign in" : "Sign in"}
                            {!submitting && <span aria-hidden="true">→</span>}
                        </button>
                    </form>

                    {!isAdminLogin && (
                        <p className="auth-switch">
                            {isRegister ? "Already have an account?" : "New to CampusConnect?"}{" "}
                            <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
                        </p>
                    )}
                    {!isRegister && (
                        <p className="auth-admin-link">
                            {mode === "admin-login" ? "Student account?" : "Campus administrator?"}{" "}
                            <Link to={mode === "admin-login" ? "/login" : "/admin-login"}>
                                {mode === "admin-login" ? "Student sign in" : "Admin sign in"}
                            </Link>
                        </p>
                    )}
                    <p className="auth-footnote">By continuing, you agree to use your campus account responsibly.</p>
                </div>
            </section>
        </main>
    );
}

function AuthLoading() {
    return <main className="auth-loading" aria-live="polite">Restoring your secure session...</main>;
}

export default function App() {
    const [user, setUser] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        apiRequest("/auth/me")
            .then((response) => setUser(response.user))
            .catch(() => setUser(null))
            .finally(() => setCheckingSession(false));
    }, []);

    async function signOut() {
        try {
            await apiRequest("/auth/logout", { method: "POST" });
        } finally {
            setUser(null);
            window.location.assign("/login");
        }
    }

    return (
        <BrowserRouter>
            {checkingSession ? <AuthLoading /> : (
                <Routes>
                    <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace /> : <AuthPage mode="login" onAuthenticated={setUser} />} />
                    <Route path="/admin-login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace /> : <AuthPage mode="admin-login" onAuthenticated={setUser} />} />
                    <Route path="/register" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace /> : <AuthPage mode="register" onAuthenticated={setUser} />} />
                    <Route path="/dashboard" element={!user ? <Navigate to="/login" replace /> : user.role === "admin" ? <Navigate to="/admin" replace /> : <DashboardApp user={user} onLogout={signOut} />} />
                    <Route path="/admin" element={!user ? <Navigate to="/admin-login" replace /> : user.role !== "admin" ? <Navigate to="/dashboard" replace /> : <DashboardApp user={user} onLogout={signOut} adminMode />} />
                    <Route path="*" element={<Navigate to={!user ? "/login" : user.role === "admin" ? "/admin" : "/dashboard"} replace />} />
                </Routes>
            )}
        </BrowserRouter>
    );
}
