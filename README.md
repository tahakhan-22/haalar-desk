# Haalar Desk — ERPNext-Aligned Defense & Aerospace ERM

Defense-grade, role-based Enterprise Resource Management (ERM) system engineered for high-reliability aerospace, telemetry, and defense electronics operations.

Aligned with **ERPNext v15 architecture**, featuring strict role confidentiality, document lifecycle states (`DocStatus`), multi-phase task work-breakdown structures (WBS), physical calibration asset custody, and earned value management (EVM).

---

## 🚀 Live Demo Credentials

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **CEO (Executive)** | `ceo` | `Haalar@2026!` | Full Executive Cockpit, EVM, Financials, Employee Salaries & CNICs |
| **Supervisor (Lead)** | `usman` | `Haalar@2026!` | Task WBS, Equipment Approvals, Team Workload & Bench Schedules |
| **Logistics Admin** | `bilal` | `Haalar@2026!` | Aerospace Component Stores, Stock Bullet Gauges, Facilities & Bills |
| **Engineers** | `zainab` / `taha` / `nouman` | `Haalar@2026!` | Task Deliverables, Notes & Blockers, Equipment Requisitions, Attendance |

---

## 🛠️ Architecture & Tech Stack

```
haalar-desk/
├── frontend/                # React 19 + TypeScript + Vite + Tailwind CSS + Recharts
│   ├── src/                 # Single-Screen High-Density Executive Cockpit
│   ├── vercel.json          # SPA rewrite configuration for Vercel
│   └── package.json
├── backend/                 # Node.js + Express + TypeScript + JWT
│   ├── src/
│   │   ├── services/store.ts # High-reliability in-memory & Postgres store
│   │   ├── routes/          # Auth, Desk Workspaces, DocTypes (Frappe style)
│   │   └── middleware/auth.ts
│   └── package.json
└── database/                # Schema DDL, DocType definitions & seeds
```

---

## 💻 Local Development Setup

### 1. Start the Backend API (Port 5000)
```bash
cd backend
npm install
npm run build
npm start
```

### 2. Start the Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## ☁️ Deploying to Vercel (Full-Stack Frontend + Backend in 1-Click)

Haalar Desk is configured with **unified full-stack Vercel deployment**:
* **Frontend**: React 19 SPA built via Vite to `frontend/dist`.
* **Backend API**: Serverless Express engine in `api/index.js` handling `/api/auth`, `/api/desk`, and `/api/doctype`.

### Step 1: Import Repository
1. Log in to [Vercel](https://vercel.com) and click **"Add New..."** $\to$ **"Project"**.
2. Select your imported GitHub repository: **`tahakhan-22/haalar-desk`**.

### Step 2: Leave All Settings as Default
Because `vercel.json` and the root `package.json` are pre-configured:
* **Root Directory**: `./` (Default root)
* **Build Command**: `cd frontend && npm install && npm run build` (Pre-configured)
* **Output Directory**: `frontend/dist` (Pre-configured)

### Step 3: Click Deploy
Click **Deploy**. Both the user interface and the live API engine will deploy simultaneously on Vercel under one domain!
Log in immediately using:
* **CEO**: `ceo` / `Haalar@2026!`
* **Supervisor**: `usman` / `Haalar@2026!`
* **Logistics**: `bilal` / `Haalar@2026!`
* **Engineers**: `zainab`, `taha`, `nouman` / `Haalar@2026!`
