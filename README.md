# Smart Inventory & Asset Management System

A production-grade, human-engineered MERN stack web application engineered for educational institutions (engineering colleges, polytechnics, university departments, and research laboratories) to digitally oversee the full lifecycle of institutional physical assets, computing systems, and laboratory instruments.

---

## 📌 Executive Summary

Manual registers, fragmented spreadsheets, and disconnected paper records frequently lead to misplaced lab equipment, uncalibrated instruments, unreturned loaner equipment, and stockouts of critical consumables. 

**Smart Inventory & Asset Management System** replaces these legacy workflows with a unified, role-governed web application featuring:
- Unique Asset Identification with dynamic **QR Code** and **Code 128 Barcode** generation.
- **Check-In & Check-Out (Circulation)** desk with return verification, borrower accountability, and condition logging.
- **Preventive & Corrective Maintenance Management** with automated overdue alerts and technician expense accounting.
- **Stock & Inventory Monitoring** with automatic threshold detection for low-stock consumables.
- **Role-Based Access Control (RBAC)** across Administrators, Laboratory Staff, and Department Heads.
- **Verifiable Audit Logging** and exportable institutional reports (CSV & print-ready layouts).

---

## 🛠️ Technology Stack (MERN Architecture)

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 19, Vite 8, React Router v7, Axios, Tailwind CSS v4, Lucide Icons |
| **Backend** | Node.js (v20+ / v22+), Express.js 4, RESTful APIs |
| **Database** | MongoDB, Mongoose 9 (Schema validation, ObjectId relationships, Indexes) |
| **Authentication & Security** | JSON Web Tokens (JWT), bcryptjs password hashing, Role Middleware |
| **Asset Tagging** | `qrcode` (High-resolution data URLs) & `jsbarcode` (Code 128 barcode rendering) |

---

## 🏛️ System Architecture

```
                                  +-----------------------------+
                                  |    React Single Page App    |
                                  |  (Vite + Tailwind + Router) |
                                  +--------------+--------------+
                                                 |
                                     HTTP REST / JSON (Axios)
                                     Bearer JWT Authorization
                                                 |
                                  +--------------v--------------+
                                  |       Express.js Server     |
                                  |  - Auth & Role Middleware   |
                                  |  - Controllers & Routes     |
                                  |  - QR / Barcode Utility     |
                                  |  - Audit Trail Engine       |
                                  +--------------+--------------+
                                                 |
                                        Mongoose ODM Driver
                                                 |
                                  +--------------v--------------+
                                  |       MongoDB Database      |
                                  | (Users, Assets, Depts,      |
                                  |  Locations, Maintenance,    |
                                  |  UsageRecords, AuditLogs)   |
                                  +-----------------------------+
```

---

## 👥 User Roles & Access Matrix

| Module / Action | ADMIN | STAFF (Lab Tech) | DEPARTMENT_HEAD |
|---|:---:|:---:|:---:|
| **Dashboard KPIs & Charts** | Full College View | Department View | Department View |
| **Asset Register (Create / Edit)** | ✅ Full | ✅ Allowed | ✅ Allowed |
| **Asset Delete** | ✅ Full | ❌ Restricted | ❌ Restricted |
| **Check-Out / Check-In Assets** | ✅ Full | ✅ Primary User | ✅ Allowed |
| **Schedule / Complete Maintenance** | ✅ Full | ✅ Allowed | ✅ Allowed |
| **Adjust Stock / Restock / Consume**| ✅ Full | ✅ Allowed | ✅ Allowed |
| **Department & Location Setup** | ✅ Full | ❌ View Only | ❌ View Only |
| **User Account Management** | ✅ Full | ❌ Restricted | ✅ View Only |
| **Security Audit Trail** | ✅ Full | ❌ Restricted | ❌ Restricted |
| **Generate & Export CSV Reports** | ✅ Full | ✅ Allowed | ✅ Allowed |

---

## 🔑 Demo Login Credentials

The database comes pre-seeded with realistic institutional profiles. All demo accounts use the standard password:

> **Password:** `password123`

| Role | Email | Name / Designation |
|---|---|---|
| **Personal Admin** | `eniyasiva2004@gmail.com` | Eniya Siva (Lead Systems Architect & Admin) |
| **Admin** | `admin@inventory.com` | Prof. Suresh Kumar (Chief Systems Admin) |
| **Lab Staff** | `staff@inventory.com` | Er. Eniya Siva (Senior Laboratory Technician) |
| **Department Head**| `head@inventory.com` | Dr. K. S. Ramanathan (Professor & HOD - CSE) |

---

## 📁 Repository Structure

```
smart-inventory/
├── src/
│   ├── backend/
│   │   ├── config/
│   │   │   └── db.ts               # MongoDB connection (Atlas, local mongod, or memory fallback)
│   │   ├── controllers/            # Auth, Asset, Usage, Maintenance, Stock, Report, Audit
│   │   ├── middleware/             # JWT auth & role-based route guard
│   │   ├── models/                 # User, Asset, Department, Location, Maintenance, UsageRecord, AuditLog, Notification
│   │   ├── routes/                 # Express REST endpoint routers
│   │   ├── seed/                   # Seed script with realistic college equipment & lab data
│   │   ├── utils/                  # QR Code generator & Audit logger
│   │   └── app.ts                  # Express application setup
│   ├── components/                 # Navbar, Sidebar, StatusBadge, QRScannerModal, NotificationDropdown
│   ├── context/                    # AuthContext with persistent login session & token handling
│   ├── pages/                      # Login, Dashboard, Assets, AssetDetails, AssetForm, Stock, Circulation, Maintenance, Reports, Users, Departments, Locations, AuditLogs, Settings
│   ├── services/                   # Axios API service with auto-header Bearer interceptor
│   ├── App.tsx                     # React Router layout and protected routes
│   ├── main.tsx                    # React DOM root entry
│   └── index.css                   # Tailwind styles and print layout media rules
├── server.ts                       # Full-stack server entry mounting Express REST APIs + Vite
├── package.json                    # Project scripts & dependencies
├── .env.example                    # Environment configuration template
├── .gitignore                      # Git exclusion rules
└── README.md                       # Comprehensive project documentation
```

---

## 🚀 Local Installation & Execution (VS Code)

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ / v22+ recommended)
- **Git** installed
- *(Optional)* **MongoDB Community Server** running locally on port 27017, or a free **MongoDB Atlas** cluster URI.
  *(Note: If no MongoDB connection string is provided, the application automatically boots an embedded in-memory MongoDB engine, guaranteeing immediate zero-configuration execution!)*

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/smart-inventory-asset-management.git
cd smart-inventory-asset-management
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optionally set your `MONGODB_URI` inside `.env`. If left empty, the zero-config embedded runner will initialize).*

### Step 4: Run Database Seed Script
```bash
npm run seed
```
This populates the database with:
- 3 User accounts (Admin, Staff, HOD)
- 6 Academic departments (CSE, IT, ECE, MECH, EEE, ADMIN)
- 8 Campus locations and laboratory rooms
- 22+ Institutional assets with dynamic QR codes & Barcodes
- 8 Scheduled & completed maintenance tickets
- Active circulation records & audit history

### Step 5: Start Development Server
```bash
npm run dev
```
Open your browser at:
```
http://localhost:3000
```
Log in using `admin@inventory.com` / `password123`.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate credentials and return JWT token.
- `GET  /api/auth/me` — Retrieve active user session.
- `POST /api/auth/logout` — Terminate session.

### Assets (`/api/assets`)
- `GET    /api/assets` — Filter, search, and paginate asset catalog.
- `GET    /api/assets/:id` — Retrieve full asset specs, QR code, and usage history.
- `GET    /api/assets/scan/:code` — Instant lookup by QR code payload, Barcode, or Asset ID.
- `POST   /api/assets` — Register asset with auto-generated QR code & Barcode.
- `PUT    /api/assets/:id` — Update asset specifications.
- `DELETE /api/assets/:id` — Remove asset from registry.

### Circulation & Loans (`/api/usage`)
- `GET  /api/usage` — Retrieve active loans and circulation history.
- `POST /api/usage/checkout` — Issue asset (updates status to 'In Use').
- `POST /api/usage/checkin` — Return asset, verify physical condition, restore available quantity.

### Maintenance (`/api/maintenance`)
- `GET  /api/maintenance` — Filter service tickets (Scheduled, In Progress, Overdue, Completed).
- `POST /api/maintenance` — Schedule maintenance ticket.
- `POST /api/maintenance/:id/complete` — Conclude service, record technician cost, restore asset.

### Stock & Inventory (`/api/stock`)
- `GET  /api/stock` — Inventory metrics and low-stock threshold monitoring.
- `POST /api/stock/adjust` — Restock, consume, or recount inventory units.

### Reports & Analytics (`/api/reports`)
- `GET /api/reports/dashboard-summary` — Aggregated KPIs and distribution data.
- `GET /api/reports/detailed` — Tabular data export for Assets, Stock, Maintenance, and Departments.

### Security Audit (`/api/audit-logs`)
- `GET /api/audit-logs` — Immutable audit trail (Admin only).

---

## 🧪 Testing & Demonstration Checklist

- [x] **Authentication Flow**: Log in as Admin, Staff, and Dept Head. Verify role badges in the navigation bar.
- [x] **Asset Registration**: Add an asset (e.g., "Digital Storage Oscilloscope"), inspect its auto-generated Asset ID, QR code, and Code 128 barcode.
- [x] **Print Asset Tag**: Open asset detail page, click "Print Asset Tag", and preview the high-contrast physical chassis label.
- [x] **QR / Barcode Search**: Click "Scan / Tag Lookup" in top bar, enter `AST-2026-0001` or `AST-2026-0003`, and jump directly to the asset.
- [x] **Circulation Cycle**:
  1. Check out an available desktop workstation or instrument to a lab practical session.
  2. Verify that its status updates to `In Use` on the Dashboard and Asset Register.
  3. Verify that trying to check it out again is blocked with a validation alert.
  4. Perform Check-In, specify return condition, and verify it returns to `Available`.
- [x] **Low-Stock Alert**: Open Stock Monitoring, find items below threshold (e.g. Arduino Kits, Raspberry Pi boards), perform "+ Restock" adjustment, and observe threshold alert clearing.
- [x] **Maintenance Workflow**: Schedule service for an asset, observe status switch to `Under Maintenance`, complete service with cost, and verify it restores to `Available`.
- [x] **CSV Report Export**: Navigate to Reports, select "Asset Inventory" or "Maintenance & Repairs", and click "Export CSV" to download the file.

---

## 📄 License
This prototype was developed for college academic presentation and laboratory asset administration. Open source under the MIT License.
