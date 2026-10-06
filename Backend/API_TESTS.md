TEAM 3 — API TESTING CHECKLIST

Start:
npm install
npm run dev

Base URL:
Use the PORT value from Backend/.env (this workspace is configured for http://localhost:5002).

ADMIN LOGIN
1. Create the admin account through the normal registration page.
2. From the Backend folder, promote that account:
  npm run make-admin -- admin@campus.edu
3. The admin signs in separately at /admin-login and is sent to /admin.
4. Admin complaint processing endpoints use /api/admin/complaints.
5. The regular student /login and /dashboard flow remains unchanged.

ADMIN ACCESS
1. Register a normal account at /register.
2. From the Backend folder, promote that account:
  npm run make-admin -- admin@campus.edu
3. Sign in at /admin-login. Admin complaint APIs are under /api/admin/complaints.
4. Standard /login and the existing /dashboard remain the student flow.

REPEAT USER LOGIN
1. Create a user account once at `/register`; users are stored in MongoDB and remain after logout.
2. Sign out, then use `/login` with the same email and password. Do not register the same user again.
3. The browser remembers the last email on that device for convenience; it does not store the password.

STUDENT VOTING
1. Sign in as a student; complaint routes under `/api/complaints` require the student session cookie.
2. `PUT /api/complaints/:id/vote` with JSON `{ "vote": true }` adds the student's support once.
3. Send `{ "vote": false }` to remove that student's support. Response data contains `voteCount` and `hasVoted`.
4. Vote identities are kept server-side and are not returned in complaint responses.

ADMIN DASHBOARD SETUP
1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `Backend/.env` (this workspace's current email is `admin@campus.edu`), start MongoDB, then start the backend from the Backend folder with `npm run dev`.
2. From the Backend folder, run `npm run make-admin` to create or update the configured admin account from the `.env` credentials.
3. Sign in at `/admin-login` with the configured email and fixed password. The admin dashboard loads complaints from `/api/admin/complaints`.
5. Admin complaint endpoints require the `campus_session` cookie for a user with role `admin`.
   Requests without a valid session return 401; signed-in non-admin users receive 403.
6. Admin can update a complaint with `PUT /api/admin/complaints/:id/status` and delete it with
   `DELETE /api/admin/complaints/:id`. Status values: `Pending`, `In Progress`, `Resolved`.

TEST 1 — Health
GET /api/health
Expected: success true

TEST 2 — Get all
GET /api/complaints
Expected:
success true
count number
data array

TEST 3 — Search
GET /api/complaints?search=wifi

TEST 4 — Filter
GET /api/complaints?status=Pending

TEST 5 — Create
POST /api/complaints
JSON:
{
  "studentName": "Karan",
  "studentId": "ST-999",
  "category": "Internet",
  "title": "WiFi is slow in room 3",
  "description": "Internet speed drops every afternoon.",
  "priority": "High",
  "location": "Room 3"
}

TEST 6 — Update
PUT /api/complaints/CC-1001/status
JSON:
{
  "status": "In Progress"
}

TEST 7 — Delete
DELETE /api/complaints/CC-1001

TEST 8 — Invalid route
GET /api/unknown
Expected: 404 JSON response

TEST 9 — Invalid status
PUT /api/complaints/CC-1002/status
{
  "status": "Completed"
}
Expected: 400

TEST 10 — Missing fields
POST /api/complaints
{
  "title": "Broken"
}
Expected: 400 with validation errors
