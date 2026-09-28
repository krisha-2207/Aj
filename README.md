# Krisha Pharmacy — Pharmacy Management & Medical Supply Management System

A full-stack, enterprise-grade Pharmacy Management and Medical Supply platform engineered for Indian retail medical stores, featuring three role-based portals (**Pharmacy Owner/Admin**, **Staff**, and **Dealer/Supplier**), batch-wise inventory tracking with dynamic **RED / GREEN / DARK RED** expiry detection, FEFO-driven dispensing, and automatic stock synchronization.

---

## 🌟 Key Highlights & Business Logic

1. **Role-Based Access Control**:
   - **Pharmacy Owner / Admin**: Complete oversight across Inventory, Medicines, Batches, Billing, Suppliers, Purchase Orders, Staff Management, Confidential Accounts & Finance (Owner-only), and Analytics Reports.
   - **Staff / Pharmacist**: Streamlined terminal for POS Billing, My Sales, My Bills, and Medicine Stock Search. Strictly blocked from financial accounts, profit calculations, purchase costs, and staff administration.
   - **Dealer / Supplier**: Dedicated vendor portal for viewing supplied medicines, batch stock in the store, and submitting supplies.
2. **Batch-Wise Inventory & Expiry Detection**:
   - Every medicine batch maintains its own batch number, manufacturing date, expiry date, initial quantity, sold quantity, remaining quantity, purchase price, and selling price.
   - **Dynamic Expiry Detection**:
     - 🔴 **EXPIRING SOON**: Expiry date is within 2 months ($\le$ 60 days) $\rightarrow$ Highlighted in **RED**.
     - 🟢 **SAFE**: Expiry date is more than 2 months away $\rightarrow$ Highlighted in **GREEN**.
     - ⚠️ **EXPIRED**: Expiry date has passed $\rightarrow$ Highlighted in **DARK RED** and strictly blocked from billing.
   - **Low Stock Warning**: Automatically flagged when remaining units $\le$ minimum stock threshold.
3. **FEFO Billing & Stock Deduction**:
   - Automatically prioritizes the earliest expiring, unexpired batch (**First Expiry, First Out**).
   - Atomic database transaction decreases `remainingQuantity` and increments `soldQuantity`. Stock is prevented from becoming negative.
   - Professional Printable Retail Tax Invoice modal with Pharmacy Name, GSTIN, Drug License Number, Batch line items, and GST breakdown.
4. **Automatic Dealer $\rightarrow$ Inventory Synchronization**:
   - When a dealer supplies medicines or a purchase order is marked **`RECEIVED`**, the corresponding `MedicineBatch` is automatically created/updated in the pharmacy inventory without duplicate manual entry.
5. **Localization & Currency**:
   - Formatted in Indian Rupees (**₹**) with Indian numbering grouping (`₹1,00,000 / ₹25,500 / ₹1,250`). Zero `$` or `USD`.

---

## 🔑 Test Login Credentials

All users are seeded with pre-configured realistic Indian data:

| Portal Role | Email / Username | Password | Accessible Modules |
| :--- | :--- | :--- | :--- |
| **Pharmacy Owner** | `owner@apollocare.com` or `owner` | `admin123` | All 10 Modules (Dashboard, Inventory, Medicines, Batches, Billing, Dealers, POs, Staff, Accounts, Reports) |
| **Staff Pharmacist** | `staff@apollocare.com` or `staff` | `staff123` | Dashboard, Billing, My Sales, My Bills, Staff Profile (Blocked from Finance & Admin) |
| **Dealer 1 (MediSupply)** | `dealer1@medisupply.com` or `dealer1` | `dealer123` | Dashboard, Supplied Medicines, Batches, Orders, Supply History, Profile |
| **Dealer 2 (Zenith Pharma)**| `dealer2@zenithpharma.com` or `dealer2` | `dealer123` | Dashboard, Supplied Medicines, Batches, Orders, Supply History, Profile |

> **Tip**: The login page also features one-click demo credentials cards to instantly log in as any role.

---

## 🏗️ Project Structure

```
d:/aj/
├── README.md               # Complete documentation and setup guide
├── .env                    # Root environment variables
├── .env.example            # Template for environment configuration
├── package.json            # Root task orchestration scripts
├── database/
│   ├── data/               # Dedicated local PostgreSQL 16 cluster
│   ├── postgres.log        # PostgreSQL server logs
│   └── start-db.bat        # Helper script to launch PostgreSQL on port 5433
├── backend/
│   ├── package.json
│   ├── .env
│   ├── prisma/
│   │   ├── schema.prisma   # Relational models, constraints, and indexes
│   │   └── seed.js         # Realistic Indian pharmacy seed script
│   └── src/
│       ├── server.js       # Main Express REST API application
│       ├── middleware/
│       │   └── auth.js     # JWT verification & role authorization (403 guard)
│       ├── routes/
│       │   ├── auth.routes.js          # Authentication (login, profile)
│       │   ├── medicine.routes.js      # Medicine catalog
│       │   ├── inventory.routes.js     # Batch inventory & dynamic expiry
│       │   ├── bill.routes.js          # POS billing with FEFO & stock deduction
│       │   ├── dealer.routes.js        # Dealer portal & direct supply
│       │   ├── purchaseOrder.routes.js # POs with auto-inventory sync
│       │   ├── account.routes.js       # Confidential Owner finance & expenses
│       │   ├── staff.routes.js         # Staff management
│       │   └── dashboard.routes.js     # Role-specific KPI metrics
│       └── utils/
│           ├── currency.js # Central ₹ formatter
│           └── expiry.js   # Dynamic expiry calculation
└── frontend/
    ├── package.json
    ├── vite.config.js      # Vite configuration with /api proxy to port 5000
    ├── tailwind.config.js  # Medical palette configuration
    ├── index.html
    └── src/
        ├── App.jsx         # Role-based route definitions and layouts
        ├── main.jsx
        ├── index.css       # Tailwind directives & print styles
        ├── api/axios.js    # Configured Axios with JWT interceptors
        ├── context/AuthContext.jsx
        ├── components/     # ProtectedRoute, Sidebar, Navbar, StatCard, ExpiryBadge, InvoiceModal
        ├── utils/formatters.js
        └── pages/
            ├── Login.jsx   # Role selection & quick-fill demo cards
            ├── owner/      # Owner Dashboard, Inventory, Medicines, Batches, Billing, Dealers, POs, Staff, Accounts, Reports
            ├── staff/      # Staff Dashboard, Billing, My Sales, Profile
            └── dealer/     # Dealer Dashboard, Supplied Medicines, Batches, Orders, Profile
```

---

## 🚀 Quick Setup & Run Instructions

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22 installed)
- **PostgreSQL**: PostgreSQL 16 (installed and running locally on port 5433)

### 2. Database Setup
The application uses an isolated PostgreSQL database cluster on port `5433`. If not already started:
```powershell
# In PowerShell:
& "C:\Program Files\PostgreSQL\16\bin\postgres.exe" -D "d:\aj\database\data" -p 5433
```

To sync the schema and seed the database:
```powershell
cd d:\aj\backend
npm run prisma:push
npm run seed
```

### 3. Start Backend Server
```powershell
cd d:\aj\backend
npm run dev
# Server listens on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 4. Start Frontend Application
```powershell
cd d:\aj\frontend
npm run dev
# Application opens at http://localhost:5173
```

---

## 🧪 Verification of Requirements

1. **Paracetamol 500mg Batch Test**:
   - `BATCH001`: Expiry date is ~45 days away $\rightarrow$ Row highlighted in **RED** with `🔴 EXPIRING SOON`.
   - `BATCH002`: Expiry date is in 2027 $\rightarrow$ Row highlighted in **GREEN** with `🟢 SAFE`.
   - `BATCH003`: Expired in Aug 2026 $\rightarrow$ Row highlighted in **DARK RED** with `⚠️ EXPIRED`.
2. **FEFO Dispensation**:
   - When adding Paracetamol to bill, `BATCH001` (earliest expiring safe batch) is automatically selected first.
   - Selling 5 units decreases `remainingQuantity` from 20 to 15, and increases `soldQuantity` from 30 to 35.
3. **Owner Accounts Confidentiality**:
   - Accessing `/owner/accounts` requires `OWNER` role.
   - Staff navigating to `/owner/accounts` is redirected to `/staff/dashboard` by frontend route guards, and backend API returns HTTP `403 Forbidden`.
4. **Dealer Supply Integration**:
   - Dealer submits medicine supply from `/dealer/dashboard` or Owner marks PO as `RECEIVED`.
   - Items immediately show in `/owner/inventory` without manual re-entry.
