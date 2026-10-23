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

## ☁️ Deploying to Vercel

### Step 1: Import Repository
1. Log in to [Vercel](https://vercel.com) and click **"Add New..."** $\to$ **"Project"**.
2. Select your imported GitHub repository: `haalar-desk`.

### Step 2: Configure Project Settings
* **Framework Preset**: `Vite`
* **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Install Command**: `npm install`

### Step 3: Environment Variables (Optional)
If your backend is hosted separately on Render, Railway, or an on-premise IP:
* `VITE_API_BASE_URL`: `https://your-backend-api-url.com` *(leave empty if deploying with local proxy)*

Click **Deploy** and your live link will be generated!
