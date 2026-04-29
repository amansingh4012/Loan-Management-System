# Loan Management System

A full-stack lending platform built with the MERN stack, Next.js, and TypeScript. Borrowers apply for loans through a multi-step form, and internal executives manage those loans through their lifecycle.

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Setup Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI if needed
npm install
npm run seed   # Creates test accounts for all roles
npm run dev    # Starts on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd client
npm install
npm run dev    # Starts on http://localhost:3000
```

## Login Credentials

All passwords: `Password@123`

| Role | Email |
|---|---|
| Admin | admin@creditsea.com |
| Sales | sales@creditsea.com |
| Sanction | sanction@creditsea.com |
| Disbursement | disbursement@creditsea.com |
| Collection | collection@creditsea.com |
| Borrower | borrower@creditsea.com |

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Next.js 16)                          │
│                                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │  Auth     │  │  Borrower    │  │  Executive Dashboard             │  │
│  │  Pages    │  │  Flow        │  │  (Sales / Sanction / Disburse /  │  │
│  │          │  │              │  │   Collection / History)           │  │
│  └────┬─────┘  └──────┬───────┘  └───────────────┬──────────────────┘  │
│       │               │                          │                      │
│       └───────────────┼──────────────────────────┘                      │
│                       │                                                  │
│              ┌────────▼────────┐                                        │
│              │  AuthContext    │  JWT stored in localStorage             │
│              │  + Axios Client │  Auto-attached via request interceptor  │
│              └────────┬────────┘                                        │
└───────────────────────┼─────────────────────────────────────────────────┘
                        │ HTTP (REST JSON)
┌───────────────────────▼─────────────────────────────────────────────────┐
│                          SERVER (Express.js)                            │
│                                                                         │
│  Request → CORS → JSON Parser → Router                                  │
│                                    │                                    │
│            ┌───────────────────────┼───────────────────────┐            │
│            │                       │                       │            │
│     /api/auth              /api/borrower          /api/dashboard        │
│     /api/admin                                                          │
│            │                       │                       │            │
│            ▼                       ▼                       ▼            │
│   ┌────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│   │  authenticate  │    │  authenticate    │    │  authenticate    │   │
│   │  (JWT verify)  │    │  authorize(ROLE) │    │  authorize(ROLE) │   │
│   └───────┬────────┘    └────────┬─────────┘    └────────┬─────────┘   │
│           ▼                      ▼                       ▼             │
│   ┌────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│   │  Controller    │    │  Controller      │    │  Controller      │   │
│   │  (auth)        │    │  (borrower)      │    │  (dashboard)     │   │
│   └───────┬────────┘    └────────┬─────────┘    └────────┬─────────┘   │
│           │                      │                       │             │
│           └──────────────────────┼───────────────────────┘             │
│                                  ▼                                      │
│                     ┌────────────────────────┐                          │
│                     │  Services Layer        │                          │
│                     │  (BRE, Loan Calc,      │                          │
│                     │   Activity Logger)     │                          │
│                     └───────────┬────────────┘                          │
│                                 ▼                                       │
│                     ┌────────────────────────┐                          │
│                     │  Mongoose ODM          │                          │
│                     │  (User, LoanApp,       │                          │
│                     │   Payment, ActivityLog)│                          │
│                     └───────────┬────────────┘                          │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │    MongoDB Atlas   │
                        └───────────────────┘
```

### Backend Structure

```
server/src/
├── config/
│   ├── db.ts               # MongoDB connection (Atlas + Google DNS fallback)
│   └── env.ts              # Typed env config with safe defaults
├── controllers/
│   ├── auth.controller.ts  # Register (bcrypt 12 rounds), Login (JWT), GetMe
│   ├── borrower.controller.ts  # Profile → Upload → Apply → MyLoans
│   ├── dashboard.controller.ts # Sales/Sanction/Disbursement/Collection
│   └── admin.controller.ts     # Users, Stats (aggregation), Activity History
├── middleware/
│   ├── auth.ts             # JWT verification → attaches req.user
│   ├── rbac.ts             # authorize(...roles) factory → 403 on mismatch
│   ├── upload.ts           # Multer disk storage (5MB, PDF/JPG/PNG)
│   ├── asyncHandler.ts     # try/catch wrapper for async route handlers
│   └── errorHandler.ts     # Global: Zod, Multer, Mongo 11000, generic 500
├── models/
│   ├── User.ts             # email, password(select:false), role, profile fields
│   ├── LoanApplication.ts  # Full loan lifecycle with audit timestamps
│   ├── Payment.ts          # UTR-based payments with unique constraint
│   └── ActivityLog.ts      # Immutable audit entries (fire-and-forget writes)
├── routes/
│   ├── auth.routes.ts      # POST /register, /login, GET /me
│   ├── borrower.routes.ts  # PUT /profile, POST /upload, /apply, GET /my-loans
│   ├── dashboard.routes.ts # Sales leads, Sanction CRUD, Disburse, Collection
│   └── admin.routes.ts     # GET /users, /stats, /history
├── services/
│   ├── bre.service.ts      # Business Rule Engine (age, salary, PAN, employment)
│   ├── loan.service.ts     # Simple interest calculator (12% p.a.)
│   └── history.service.ts  # Fire-and-forget ActivityLog writer
├── utils/
│   ├── constants.ts        # Enums (UserRole, LoanStatus, EmploymentMode), limits
│   └── validators.ts       # Zod schemas for every write endpoint
├── seed.ts                 # Creates one account per role (idempotent upsert)
└── app.ts                  # Express bootstrap, route mounting, error handler
```

### Frontend Structure

```
client/src/
├── app/
│   ├── layout.tsx              # Root layout with AuthProvider
│   ├── page.tsx                # Landing redirect → /login
│   ├── globals.css             # Full design system (CSS custom properties)
│   ├── login/page.tsx          # Sign-in + test credential quick-fill
│   ├── register/page.tsx       # Borrower self-registration
│   ├── borrower/
│   │   ├── profile/page.tsx    # Step 2: Personal details + BRE check
│   │   ├── upload/page.tsx     # Step 3: Salary slip upload
│   │   ├── apply/page.tsx      # Step 4: Loan amount + tenure → submit
│   │   └── my-loans/page.tsx   # View all submitted applications + status
│   └── dashboard/
│       ├── layout.tsx          # Sidebar nav (role-filtered) + auth guard
│       ├── sales/page.tsx      # Lead tracker — unengaged borrowers
│       ├── sanction/page.tsx   # Approve / Reject with reason
│       ├── disbursement/page.tsx # Mark sanctioned loans as disbursed
│       ├── collection/page.tsx # Record payments, auto-close on full repay
│       └── history/page.tsx    # Admin-only paginated activity log
└── lib/
    ├── api.ts                  # Axios instance, JWT interceptor, 401 redirect
    ├── auth-context.tsx        # React Context: login, register, logout, refreshUser
    └── constants.ts            # Role/status configs, formatCurrency, formatDate
```

---

## Design Flow

### Borrower Journey (4-Step Application)

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Step 1  │────▶│   Step 2     │────▶│   Step 3      │────▶│   Step 4     │
│ Register │     │ Profile +    │     │ Upload Salary │     │ Apply for    │
│ (email,  │     │ BRE Check    │     │ Slip (staged  │     │ Loan (amount │
│ password)│     │ (server-side │     │ on User doc)  │     │ + tenure)    │
└──────────┘     │ validation)  │     └───────────────┘     └──────┬───────┘
                 └──────────────┘                                   │
                                                                    ▼
                                                         LoanApplication
                                                         created with:
                                                         • Calculated SI
                                                         • Linked salary slip
                                                         • status: "applied"
                                                         • Staged slip cleared
```

**Key Design Decisions:**

1. **Salary slip staging**: The slip is uploaded to the User document *before* the LoanApplication exists. On apply (Step 4), the URL is copied from `User.salarySlipUrl` → `LoanApplication.salarySlipUrl`, then cleared from User. This ensures each application owns its own slip, and the server is always the source of truth.

2. **BRE runs server-side only**: The Business Rule Engine validates eligibility during profile save (Step 2). Running it exclusively on the server prevents client-side bypass. If BRE fails, the profile is *not* saved — the borrower must correct their data.

3. **Step enforcement**: Each step validates that the previous step is complete:
   - Upload requires `profileCompleted === true`
   - Apply requires both `profileCompleted` and `salarySlipUrl` present on User

### Executive Loan Lifecycle

```
                    ┌─────────────────────────────────────────────────┐
                    │              EXECUTIVE WORKFLOW                  │
                    │                                                  │
  APPLIED           │  Sanction Executive                              │
  ───────────────▶  │  ┌─────────────────────────────────┐            │
  (borrower         │  │  Review application + slip       │            │
   submits)         │  │  ├─ APPROVE → status: SANCTIONED │            │
                    │  │  └─ REJECT  → status: REJECTED   │            │
                    │  │     (requires reason, min 5 char) │            │
                    │  └────────────────┬────────────────┘            │
                    │                   │ (if approved)               │
                    │                   ▼                              │
                    │  Disbursement Executive                          │
                    │  ┌─────────────────────────────────┐            │
                    │  │  DISBURSE → status: DISBURSED    │            │
                    │  │  Records disbursedBy + timestamp │            │
                    │  └────────────────┬────────────────┘            │
                    │                   ▼                              │
                    │  Collection Executive                            │
                    │  ┌─────────────────────────────────┐            │
                    │  │  Record payments (UTR + amount)  │            │
                    │  │  • Validates amount ≤ outstanding│            │
                    │  │  • UTR must be unique system-wide│            │
                    │  │  • Auto-closes when balance = 0  │            │
                    │  │  → status: CLOSED (automatic)    │            │
                    │  └─────────────────────────────────┘            │
                    └─────────────────────────────────────────────────┘
```

**Status transition rules** are enforced server-side — each controller checks the current status before allowing a transition. Invalid transitions return `400 Bad Request`.

### Admin Overview

The Admin role has cross-cutting access to the entire system:

| Capability | Endpoint | Description |
|---|---|---|
| View all users | `GET /api/admin/users?role=` | Filterable user list |
| Dashboard stats | `GET /api/admin/stats` | Aggregated counts + total disbursed amount |
| Activity audit | `GET /api/admin/history?action=&page=&limit=` | Paginated, filterable audit trail |
| All exec modules | `GET /api/dashboard/*` | Admin can access Sales, Sanction, Disbursement, and Collection |

---

## Data Model

```
┌──────────────────────┐       ┌─────────────────────────┐
│        User          │       │    LoanApplication      │
├──────────────────────┤       ├─────────────────────────┤
│ _id                  │◄──────│ borrower (ObjectId, ref) │
│ email (unique)       │       │ loanAmount              │
│ password (select:off)│       │ tenureDays              │
│ role (enum)          │       │ interestRate (fixed 12%) │
│ fullName             │       │ simpleInterest          │
│ pan                  │       │ totalRepayment          │
│ dateOfBirth          │       │ outstandingBalance      │
│ monthlySalary        │       │ salarySlipUrl           │
│ employmentMode       │       │ status (enum)           │
│ profileCompleted     │       │ rejectionReason?        │
│ salarySlipUrl?       │       │ sanctionedBy? (ref)     │
│ (staging area)       │       │ disbursedBy? (ref)      │
└──────────────────────┘       │ closedAt?               │
                               └────────────┬────────────┘
                                            │
                               ┌────────────▼────────────┐
                               │       Payment           │
                               ├─────────────────────────┤
                               │ loanApplication (ref)   │
                               │ utrNumber (unique)      │
                               │ amount                  │
                               │ paymentDate             │
                               │ recordedBy (ref → User) │
                               └─────────────────────────┘

┌─────────────────────────┐
│     ActivityLog         │
├─────────────────────────┤
│ action (enum)           │  ← USER_REGISTERED, LOAN_APPLIED, LOAN_SANCTIONED,
│ performedBy (ref)       │    LOAN_REJECTED, LOAN_DISBURSED, PAYMENT_RECORDED,
│ targetLoan? (ref)       │    LOAN_CLOSED, PROFILE_UPDATED
│ targetUser? (ref)       │
│ metadata (Mixed)        │  ← Stores context (loanAmount, UTR, reason, etc.)
│ createdAt               │
└─────────────────────────┘
```

**Indexes:**
- `User.email` — unique, for login lookups
- `User.role` — for admin user filtering
- `LoanApplication.borrower` — for "my loans" queries
- `LoanApplication.{status, createdAt}` — compound index for dashboard queries
- `Payment.utrNumber` — unique, prevents duplicate UTR entries
- `ActivityLog.{createdAt}`, `{action, createdAt}` — for paginated history

---

## API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create borrower account |
| POST | `/login` | — | Authenticate, returns JWT |
| GET | `/me` | JWT | Current user profile |

### Borrower (`/api/borrower`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/profile` | Borrower | Save profile + run BRE |
| POST | `/upload-salary-slip` | Borrower | Upload salary slip (multipart) |
| POST | `/apply-loan` | Borrower | Submit loan application |
| GET | `/my-loans` | Borrower | List own applications |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sales/leads` | Sales, Admin | Borrowers with no applications |
| GET | `/sanction/applications` | Sanction, Admin | Applications with status `applied` |
| PATCH | `/sanction/applications/:id/approve` | Sanction, Admin | Approve → `sanctioned` |
| PATCH | `/sanction/applications/:id/reject` | Sanction, Admin | Reject with reason → `rejected` |
| GET | `/disbursement/loans` | Disbursement, Admin | Loans with status `sanctioned` |
| PATCH | `/disbursement/loans/:id/disburse` | Disbursement, Admin | Disburse → `disbursed` |
| GET | `/collection/loans` | Collection, Admin | Loans with status `disbursed` |
| POST | `/collection/loans/:id/payment` | Collection, Admin | Record payment (UTR + amount) |
| GET | `/collection/loans/:id/payments` | Collection, Admin | Payment history for a loan |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | All users (optional `?role=` filter) |
| GET | `/stats` | Admin | Aggregated statistics |
| GET | `/history` | Admin | Paginated activity logs |

---

## Security & Middleware Pipeline

Every request flows through this pipeline:

```
Request
  │
  ├─ cors()                     ← Allow cross-origin (client on :3000)
  ├─ express.json()             ← Parse JSON body
  ├─ express.urlencoded()       ← Parse form data
  │
  ├─ Router match
  │   ├─ authenticate           ← Verify JWT, attach req.user
  │   ├─ authorize(...roles)    ← Check req.user.role ∈ allowed set → 403
  │   ├─ upload.single()        ← (borrower upload only) Multer file handling
  │   └─ Controller             ← Zod validates body, executes business logic
  │
  ├─ 404 Handler                ← Unmatched routes
  └─ errorHandler               ← Catches: ZodError(400), MulterError(400),
                                   Mongo 11000(409), generic(500)
```

**Security highlights:**
- Passwords hashed with **bcrypt (12 salt rounds)**, never stored in plaintext
- `password` field has `select: false` — excluded from all queries by default
- JWT tokens expire after **7 days** (configurable via `JWT_EXPIRES_IN`)
- Client-side 401 interceptor auto-clears token and redirects to `/login`
- File uploads restricted to **PDF/JPG/PNG**, max **5 MB**
- UTR uniqueness enforced at both **application layer** and **database unique index**

### RBAC Matrix

| Module | Sales | Sanction | Disbursement | Collection | Admin | Borrower |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Sales Tracker | ✅ | — | — | — | ✅ | — |
| Sanction Review | — | ✅ | — | — | ✅ | — |
| Disbursement | — | — | ✅ | — | ✅ | — |
| Collection | — | — | — | ✅ | ✅ | — |
| Activity History | — | — | — | — | ✅ | — |
| Borrower Flow | — | — | — | — | — | ✅ |

### BRE Rules (Server-side)

| Rule | Rejection Condition |
|---|---|
| Age | Not between 23 and 50 |
| Salary | Below ₹25,000/month |
| PAN | Invalid format (expected: `ABCDE1234F`) |
| Employment | Applicant is unemployed |

### Loan Math

```
Simple Interest = (P × 12 × T) / (365 × 100)   where T = tenure in days
Total Repayment = P + SI
```

- Interest rate: fixed **12% per annum**
- Loan range: **₹50,000 – ₹5,00,000**
- Tenure range: **30 – 365 days**

---

## Audit Trail

Every critical action in the loan lifecycle is recorded to the `ActivityLog` collection via a **fire-and-forget** service. Writes are asynchronous and never block the caller's HTTP response — failures are logged to `stderr` and swallowed.

**Tracked actions:**

| Action | Trigger |
|---|---|
| `USER_REGISTERED` | New borrower account created |
| `PROFILE_UPDATED` | Borrower saves profile (post-BRE) |
| `LOAN_APPLIED` | Loan application submitted |
| `LOAN_SANCTIONED` | Sanction executive approves |
| `LOAN_REJECTED` | Sanction executive rejects (with reason) |
| `LOAN_DISBURSED` | Disbursement executive disburses |
| `PAYMENT_RECORDED` | Collection executive records a payment |
| `LOAN_CLOSED` | Auto-triggered when outstanding balance reaches ₹0 |

Admins access the full audit trail from the **Activity History** dashboard (`/dashboard/history`), with pagination and action-type filtering.

---

## .env.example

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loan-management
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

