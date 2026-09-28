-- ============================================================================
-- PHARMAFLOW: PHARMACY MANAGEMENT & MEDICAL SUPPLY PLATFORM
-- COMPREHENSIVE SUPABASE / POSTGRESQL PRODUCTION DATABASE SCHEMA
-- ============================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('OWNER', 'STAFF', 'DEALER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CORE RELATIONAL TABLES
-- ============================================================================

-- 1. Pharmacy Store Profile
CREATE TABLE IF NOT EXISTS "Pharmacy" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "gstin" VARCHAR(50) NOT NULL,
    "dlNumber" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Accounts (Owner, Staff, Dealer)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "username" VARCHAR(100) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "phone" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "pharmacyId" TEXT REFERENCES "Pharmacy"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");

-- 3. Staff Pharmacist Profiles
CREATE TABLE IF NOT EXISTS "Staff" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "employeeCode" VARCHAR(50) NOT NULL UNIQUE,
    "designation" VARCHAR(100) NOT NULL DEFAULT 'Pharmacist',
    "salary" DOUBLE PRECISION,
    "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dealers & Pharmaceutical Suppliers
CREATE TABLE IF NOT EXISTS "Dealer" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "companyName" VARCHAR(255) NOT NULL,
    "contactPerson" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "gstin" VARCHAR(50) NOT NULL,
    "dlNumber" VARCHAR(100),
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Medicine Master Catalog
CREATE TABLE IF NOT EXISTS "Medicine" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "productId" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "genericName" VARCHAR(255),
    "category" VARCHAR(100) NOT NULL,
    "dosageForm" VARCHAR(100) DEFAULT 'Tablet',
    "strength" VARCHAR(100),
    "manufacturer" VARCHAR(255) NOT NULL,
    "hsnCode" VARCHAR(50) NOT NULL DEFAULT '3004',
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "unit" VARCHAR(50) NOT NULL DEFAULT 'Strip',
    "minStockLevel" INTEGER NOT NULL DEFAULT 15,
    "dosageUsage" TEXT DEFAULT 'Take as advised by physician. Follow prescription directions.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_medicine_productId" ON "Medicine"("productId");
CREATE INDEX IF NOT EXISTS "idx_medicine_name" ON "Medicine"("name");
CREATE INDEX IF NOT EXISTS "idx_medicine_category" ON "Medicine"("category");

-- 6. Batch-Wise Inventory (FEFO Tracking & Dynamic Expiry)
CREATE TABLE IF NOT EXISTS "MedicineBatch" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "batchNumber" VARCHAR(100) NOT NULL,
    "medicineId" TEXT NOT NULL REFERENCES "Medicine"("id") ON DELETE CASCADE,
    "dealerId" TEXT REFERENCES "Dealer"("id") ON DELETE SET NULL,
    "pharmacyId" TEXT REFERENCES "Pharmacy"("id") ON DELETE SET NULL,
    "initialQuantity" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "remainingQuantity" INTEGER NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "mfgDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_medicine_batch" UNIQUE ("medicineId", "batchNumber")
);

CREATE INDEX IF NOT EXISTS "idx_batch_expiryDate" ON "MedicineBatch"("expiryDate");
CREATE INDEX IF NOT EXISTS "idx_batch_batchNumber" ON "MedicineBatch"("batchNumber");
CREATE INDEX IF NOT EXISTS "idx_batch_remainingQuantity" ON "MedicineBatch"("remainingQuantity");

-- 7. Purchase Orders & Consignments
CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderNumber" VARCHAR(100) NOT NULL UNIQUE,
    "dealerId" TEXT NOT NULL REFERENCES "Dealer"("id") ON DELETE CASCADE,
    "pharmacyId" TEXT NOT NULL REFERENCES "Pharmacy"("id") ON DELETE CASCADE,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_po_status" ON "PurchaseOrder"("status");
CREATE INDEX IF NOT EXISTS "idx_po_dealerId" ON "PurchaseOrder"("dealerId");

-- 8. Purchase Order Line Items
CREATE TABLE IF NOT EXISTS "PurchaseOrderItem" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
    "medicineId" TEXT NOT NULL REFERENCES "Medicine"("id") ON DELETE CASCADE,
    "batchNumber" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "mfgDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_poi_poId" ON "PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "idx_poi_medId" ON "PurchaseOrderItem"("medicineId");

-- 9. Customer Registry
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerCode" VARCHAR(50) UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL UNIQUE,
    "email" VARCHAR(255),
    "address" TEXT,
    "age" INTEGER,
    "gender" VARCHAR(20),
    "customerType" VARCHAR(50) NOT NULL DEFAULT 'NEW',
    "totalVisits" INTEGER NOT NULL DEFAULT 1,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_customer_phone" ON "Customer"("phone");

-- 10. POS Bills & Tax Invoices
CREATE TABLE IF NOT EXISTS "Bill" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "billNumber" VARCHAR(100) NOT NULL UNIQUE,
    "pharmacyId" TEXT NOT NULL REFERENCES "Pharmacy"("id") ON DELETE CASCADE,
    "staffId" TEXT NOT NULL REFERENCES "User"("id"),
    "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "customerPhone" VARCHAR(50) NOT NULL,
    "customerType" VARCHAR(50) NOT NULL DEFAULT 'NEW',
    "customerAddress" TEXT,
    "customerAge" INTEGER,
    "customerGender" VARCHAR(20),
    "doctorName" VARCHAR(255) DEFAULT 'Dr. Self / Consulting Physician',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_bill_billNumber" ON "Bill"("billNumber");
CREATE INDEX IF NOT EXISTS "idx_bill_staffId" ON "Bill"("staffId");
CREATE INDEX IF NOT EXISTS "idx_bill_createdAt" ON "Bill"("createdAt");

-- 11. Bill Line Items
CREATE TABLE IF NOT EXISTS "BillItem" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "billId" TEXT NOT NULL REFERENCES "Bill"("id") ON DELETE CASCADE,
    "medicineId" TEXT NOT NULL REFERENCES "Medicine"("id") ON DELETE CASCADE,
    "batchId" TEXT NOT NULL REFERENCES "MedicineBatch"("id") ON DELETE CASCADE,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "usageInstructions" TEXT,
    "doctorName" VARCHAR(255) DEFAULT 'Dr. Self / Consulting Physician',
    "customerType" VARCHAR(50) DEFAULT 'NEW',
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_billitem_billId" ON "BillItem"("billId");
CREATE INDEX IF NOT EXISTS "idx_billitem_batchId" ON "BillItem"("batchId");
CREATE INDEX IF NOT EXISTS "idx_billitem_medicineId" ON "BillItem"("medicineId");

-- 12. Sales Returns
CREATE TABLE IF NOT EXISTS "SalesReturn" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "returnNumber" VARCHAR(100) NOT NULL UNIQUE,
    "billId" TEXT REFERENCES "Bill"("id") ON DELETE SET NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "customerPhone" VARCHAR(50),
    "doctorName" VARCHAR(255) DEFAULT 'Dr. Self / Consulting Physician',
    "medicineName" VARCHAR(255) NOT NULL,
    "batchNumber" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "gstRefund" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reason" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_salesreturn_number" ON "SalesReturn"("returnNumber");
CREATE INDEX IF NOT EXISTS "idx_salesreturn_billId" ON "SalesReturn"("billId");
CREATE INDEX IF NOT EXISTS "idx_salesreturn_date" ON "SalesReturn"("returnDate");

-- 13. Purchase Returns
CREATE TABLE IF NOT EXISTS "PurchaseReturn" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "returnNumber" VARCHAR(100) NOT NULL UNIQUE,
    "dealerId" TEXT NOT NULL REFERENCES "Dealer"("id") ON DELETE CASCADE,
    "medicineName" VARCHAR(255) NOT NULL,
    "batchNumber" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "gstReversal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_purchasereturn_number" ON "PurchaseReturn"("returnNumber");
CREATE INDEX IF NOT EXISTS "idx_purchasereturn_dealerId" ON "PurchaseReturn"("dealerId");
CREATE INDEX IF NOT EXISTS "idx_purchasereturn_date" ON "PurchaseReturn"("returnDate");

-- 14. Operational Expenses & Finance Ledgers
CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "pharmacyId" TEXT NOT NULL REFERENCES "Pharmacy"("id") ON DELETE CASCADE,
    "category" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL DEFAULT 'CASH',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_expense_pharmacyId" ON "Expense"("pharmacyId");
CREATE INDEX IF NOT EXISTS "idx_expense_date" ON "Expense"("date");
