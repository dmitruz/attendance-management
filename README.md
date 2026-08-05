# Attendance Management System

**Live demo:** https://dmitruz.github.io/attendance-management/
**API:** https://attendance-management-wupo.onrender.com/api

### Try it yourself

Email: admin@yourcompany.com
Password: SomeStrongPassword123!

From there you can create departments, add employee accounts, check in/out as an employee, and pull filtered attendance reports with CSV export. This is a shared public demo, not a private instance — please be considerate with the data, and don't be surprised if it occasionally gets reset or modified by other visitors.

Note: the API is hosted on Render's free tier, which spins down after ~15 minutes of inactivity. If it's been idle, the first request (e.g. logging in) can take 30-60 seconds while it wakes back up — that's expected, not a bug.

The live demo is seeded with an admin account you're welcome to log in with and explore:

A full-stack employee attendance tracker built with **Node.js / Express / MongoDB** on the backend and **React (Vite)** on the frontend. Employees check in/out from a personal dashboard; admins manage departments and employee accounts, and pull filterable, exportable attendance reports.

Backend endpoints are covered by a **Jest + Supertest** test suite exercising authentication, role-based access control, check-in/check-out edge cases, and CSV export.



## Features

- **JWT authentication** with `admin` / `employee` roles
- Employee self-service: check in, check out, view personal attendance history
- Admin dashboard: manage departments, manage employees (soft-delete/deactivate, not destructive delete), filter attendance by employee/department/status/date range
- CSV export of any filtered attendance report
- Automatic **late** detection based on a configurable check-in cutoff time
- One attendance record per employee per day, enforced at the database level (unique compound index)
- API test suite using an in-memory MongoDB instance — no external database needed to run tests
- GitHub Actions CI: runs the server test suite and builds the client on every push/PR

## Tech stack

| Layer     | Technology                                              |
| --------- | -------------------------------------------------------- |
| Backend   | Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs, json2csv |
| Frontend  | React 18, Vite, React Router, Axios                      |
| Testing   | Jest, Supertest, mongodb-memory-server                   |
| CI        | GitHub Actions                                            |

## Project structure

```
attendance-management/
├── server/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/            # User, Department, Attendance
│   │   ├── middleware/        # auth (JWT), role (RBAC), errorHandler
│   │   ├── controllers/       # auth, department, employee, attendance
│   │   ├── routes/
│   │   ├── utils/             # generateToken, date helpers
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                 # Jest + Supertest suite
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/axios.js       # axios instance + auth interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/        # Navbar, PrivateRoute
│   │   ├── pages/             # Login, EmployeeDashboard, Admin*
│   │   └── App.jsx
│   └── package.json
└── .github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 1. Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev
```

The server boots on `http://localhost:5000`. If `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are set in `.env` and no admin account exists yet, one is created automatically on first boot — use those credentials to log in and start adding departments/employees.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:5173` and expects the API at `http://localhost:5000/api` (configurable via `VITE_API_URL`).

### 3. Run the test suite

```bash
cd server
npm test
```

Tests spin up an in-memory MongoDB instance automatically (via `mongodb-memory-server`), so no external database is required — just make sure the machine running them has internet access the first time, to download the mongod binary.

## API reference

All routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Route         | Access  | Description                |
| ------ | ------------- | ------- | -------------------------- |
| POST   | `/auth/login` | Public  | Log in, returns JWT + user  |
| GET    | `/auth/me`    | Private | Get the current user        |

### Departments

| Method | Route              | Access | Description                          |
| ------ | ------------------- | ------ | ------------------------------------- |
| GET    | `/departments`      | Private | List all departments                 |
| POST   | `/departments`      | Admin   | Create a department                   |
| PUT    | `/departments/:id`  | Admin   | Update a department                   |
| DELETE | `/departments/:id`  | Admin   | Delete a department (blocked if employees are assigned) |

### Employees

| Method | Route              | Access | Description                                 |
| ------ | ------------------- | ------ | -------------------------------------------- |
| GET    | `/employees`        | Admin  | List employees (`?department=&search=`)      |
| GET    | `/employees/:id`    | Admin  | Get a single employee                        |
| POST   | `/employees`        | Admin  | Create an employee account                   |
| PUT    | `/employees/:id`    | Admin  | Update an employee                           |
| DELETE | `/employees/:id`    | Admin  | Deactivate an employee (soft delete)         |

### Attendance

| Method | Route                | Access  | Description                                                      |
| ------ | --------------------- | ------- | ------------------------------------------------------------------ |
| POST   | `/attendance/check-in`  | Employee | Check in for today                                              |
| POST   | `/attendance/check-out` | Employee | Check out for today                                             |
| GET    | `/attendance/me`        | Employee | Own attendance history (`?from=&to=`)                           |
| GET    | `/attendance`           | Admin    | All attendance, filterable by `employee`, `department`, `status`, `from`, `to` |
| GET    | `/attendance/summary`   | Admin    | Aggregated present/late/absent counts per employee               |
| GET    | `/attendance/export`    | Admin    | CSV export of the filtered attendance report                     |
| PUT    | `/attendance/:id`       | Admin    | Manually correct a record (e.g. mark `on-leave`)                 |

## Notes on design decisions

- **Soft delete for employees**: deactivating rather than deleting keeps historical attendance records intact and queryable.
- **One record per employee per day**: enforced with a unique compound index on `(employee, date)`, with `date` normalized to midnight UTC — this avoids duplicate/racy check-ins and makes date-range queries simple.
- **Late detection**: a `LATE_CUTOFF` env var (default `09:15`, UTC) is compared against the check-in timestamp to auto-flag `late` status.

## License

MIT
