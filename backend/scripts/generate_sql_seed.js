const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5433/pharmacy_db?schema=public';
process.env.DATABASE_URL = dbUrl;
const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportSeedSql() {
  console.log('Exporting database records into standalone SQL statements...');

  let sql = `-- ============================================================================
-- PHARMAFLOW: SUPABASE SEED DATA SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR AFTER RUNNING supabase_schema.sql
-- ============================================================================

-- Clean existing demo data (Reverse dependency order)
DELETE FROM "SalesReturn";
DELETE FROM "PurchaseReturn";
DELETE FROM "BillItem";
DELETE FROM "Bill";
DELETE FROM "Customer";
DELETE FROM "PurchaseOrderItem";
DELETE FROM "PurchaseOrder";
DELETE FROM "MedicineBatch";
DELETE FROM "Medicine";
DELETE FROM "Expense";
DELETE FROM "Staff";
DELETE FROM "Dealer";
DELETE FROM "User";
DELETE FROM "Pharmacy";

`;

  // 1. Pharmacy
  const pharmacies = await prisma.pharmacy.findMany();
  sql += `-- 1. PHARMACY STORE PROFILE\n`;
  for (const p of pharmacies) {
    sql += `INSERT INTO "Pharmacy" ("id", "name", "address", "phone", "email", "gstin", "dlNumber", "createdAt", "updatedAt") VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.address)}, ${escapeSql(p.phone)}, ${escapeSql(p.email)}, ${escapeSql(p.gstin)}, ${escapeSql(p.dlNumber)}, ${escapeSql(p.createdAt)}, ${escapeSql(p.updatedAt)});\n`;
  }

  // 2. Users
  const users = await prisma.user.findMany();
  sql += `\n-- 2. USERS\n`;
  for (const u of users) {
    sql += `INSERT INTO "User" ("id", "email", "username", "password", "name", "role", "phone", "status", "pharmacyId", "createdAt", "updatedAt") VALUES (${escapeSql(u.id)}, ${escapeSql(u.email)}, ${escapeSql(u.username)}, ${escapeSql(u.password)}, ${escapeSql(u.name)}, '${u.role}', ${escapeSql(u.phone)}, ${escapeSql(u.status)}, ${escapeSql(u.pharmacyId)}, ${escapeSql(u.createdAt)}, ${escapeSql(u.updatedAt)});\n`;
  }

  // 3. Staff
  const staffList = await prisma.staff.findMany();
  sql += `\n-- 3. STAFF PHARMACISTS\n`;
  for (const s of staffList) {
    sql += `INSERT INTO "Staff" ("id", "userId", "employeeCode", "designation", "salary", "joinedDate") VALUES (${escapeSql(s.id)}, ${escapeSql(s.userId)}, ${escapeSql(s.employeeCode)}, ${escapeSql(s.designation)}, ${escapeSql(s.salary)}, ${escapeSql(s.joinedDate)});\n`;
  }

  // 4. Dealers
  const dealers = await prisma.dealer.findMany();
  sql += `\n-- 4. DEALERS & DISTRIBUTORS\n`;
  for (const d of dealers) {
    sql += `INSERT INTO "Dealer" ("id", "userId", "companyName", "contactPerson", "phone", "email", "gstin", "dlNumber", "address", "createdAt", "updatedAt") VALUES (${escapeSql(d.id)}, ${escapeSql(d.userId)}, ${escapeSql(d.companyName)}, ${escapeSql(d.contactPerson)}, ${escapeSql(d.phone)}, ${escapeSql(d.email)}, ${escapeSql(d.gstin)}, ${escapeSql(d.dlNumber)}, ${escapeSql(d.address)}, ${escapeSql(d.createdAt)}, ${escapeSql(d.updatedAt)});\n`;
  }

  // 5. Medicines (All 50 items)
  const medicines = await prisma.medicine.findMany({ orderBy: { productId: 'asc' } });
  sql += `\n-- 5. MEDICINES CATALOG (50 MEDICINES)\n`;
  for (const m of medicines) {
    sql += `INSERT INTO "Medicine" ("id", "productId", "name", "genericName", "category", "dosageForm", "strength", "manufacturer", "hsnCode", "gstRate", "unit", "minStockLevel", "dosageUsage", "createdAt", "updatedAt") VALUES (${escapeSql(m.id)}, ${escapeSql(m.productId)}, ${escapeSql(m.name)}, ${escapeSql(m.genericName)}, ${escapeSql(m.category)}, ${escapeSql(m.dosageForm)}, ${escapeSql(m.strength)}, ${escapeSql(m.manufacturer)}, ${escapeSql(m.hsnCode)}, ${escapeSql(m.gstRate)}, ${escapeSql(m.unit)}, ${escapeSql(m.minStockLevel)}, ${escapeSql(m.dosageUsage)}, ${escapeSql(m.createdAt)}, ${escapeSql(m.updatedAt)});\n`;
  }

  // 6. Medicine Batches
  const batches = await prisma.medicineBatch.findMany();
  sql += `\n-- 6. MEDICINE BATCHES (FEFO INVENTORY)\n`;
  for (const b of batches) {
    sql += `INSERT INTO "MedicineBatch" ("id", "batchNumber", "medicineId", "dealerId", "pharmacyId", "initialQuantity", "soldQuantity", "remainingQuantity", "purchasePrice", "sellingPrice", "mfgDate", "expiryDate", "receivedDate", "createdAt", "updatedAt") VALUES (${escapeSql(b.id)}, ${escapeSql(b.batchNumber)}, ${escapeSql(b.medicineId)}, ${escapeSql(b.dealerId)}, ${escapeSql(b.pharmacyId)}, ${escapeSql(b.initialQuantity)}, ${escapeSql(b.soldQuantity)}, ${escapeSql(b.remainingQuantity)}, ${escapeSql(b.purchasePrice)}, ${escapeSql(b.sellingPrice)}, ${escapeSql(b.mfgDate)}, ${escapeSql(b.expiryDate)}, ${escapeSql(b.receivedDate)}, ${escapeSql(b.createdAt)}, ${escapeSql(b.updatedAt)});\n`;
  }

  // 7. Customers
  const customers = await prisma.customer.findMany();
  sql += `\n-- 7. CUSTOMER REGISTRY\n`;
  for (const c of customers) {
    sql += `INSERT INTO "Customer" ("id", "customerCode", "name", "phone", "email", "address", "age", "gender", "customerType", "totalVisits", "totalSpent", "createdAt", "updatedAt") VALUES (${escapeSql(c.id)}, ${escapeSql(c.customerCode)}, ${escapeSql(c.name)}, ${escapeSql(c.phone)}, ${escapeSql(c.email)}, ${escapeSql(c.address)}, ${escapeSql(c.age)}, ${escapeSql(c.gender)}, ${escapeSql(c.customerType)}, ${escapeSql(c.totalVisits)}, ${escapeSql(c.totalSpent)}, ${escapeSql(c.createdAt)}, ${escapeSql(c.updatedAt)});\n`;
  }

  // 8. Purchase Orders
  const pos = await prisma.purchaseOrder.findMany();
  sql += `\n-- 8. PURCHASE ORDERS\n`;
  for (const po of pos) {
    sql += `INSERT INTO "PurchaseOrder" ("id", "orderNumber", "dealerId", "pharmacyId", "status", "totalAmount", "orderDate", "receivedDate", "notes", "createdAt", "updatedAt") VALUES (${escapeSql(po.id)}, ${escapeSql(po.orderNumber)}, ${escapeSql(po.dealerId)}, ${escapeSql(po.pharmacyId)}, '${po.status}', ${escapeSql(po.totalAmount)}, ${escapeSql(po.orderDate)}, ${escapeSql(po.receivedDate)}, ${escapeSql(po.notes)}, ${escapeSql(po.createdAt)}, ${escapeSql(po.updatedAt)});\n`;
  }

  // 9. Purchase Order Items
  const pois = await prisma.purchaseOrderItem.findMany();
  sql += `\n-- 9. PURCHASE ORDER LINE ITEMS\n`;
  for (const poi of pois) {
    sql += `INSERT INTO "PurchaseOrderItem" ("id", "purchaseOrderId", "medicineId", "batchNumber", "quantity", "purchasePrice", "sellingPrice", "mfgDate", "expiryDate", "createdAt") VALUES (${escapeSql(poi.id)}, ${escapeSql(poi.purchaseOrderId)}, ${escapeSql(poi.medicineId)}, ${escapeSql(poi.batchNumber)}, ${escapeSql(poi.quantity)}, ${escapeSql(poi.purchasePrice)}, ${escapeSql(poi.sellingPrice)}, ${escapeSql(poi.mfgDate)}, ${escapeSql(poi.expiryDate)}, ${escapeSql(poi.createdAt)});\n`;
  }

  // 10. Bills
  const bills = await prisma.bill.findMany();
  sql += `\n-- 10. BILLS & INVOICES\n`;
  for (const bi of bills) {
    sql += `INSERT INTO "Bill" ("id", "billNumber", "pharmacyId", "staffId", "customerId", "customerName", "customerPhone", "customerType", "customerAddress", "customerAge", "customerGender", "doctorName", "paymentMethod", "subtotal", "discount", "taxAmount", "grandTotal", "createdAt") VALUES (${escapeSql(bi.id)}, ${escapeSql(bi.billNumber)}, ${escapeSql(bi.pharmacyId)}, ${escapeSql(bi.staffId)}, ${escapeSql(bi.customerId)}, ${escapeSql(bi.customerName)}, ${escapeSql(bi.customerPhone)}, ${escapeSql(bi.customerType)}, ${escapeSql(bi.customerAddress)}, ${escapeSql(bi.customerAge)}, ${escapeSql(bi.customerGender)}, ${escapeSql(bi.doctorName)}, '${bi.paymentMethod}', ${escapeSql(bi.subtotal)}, ${escapeSql(bi.discount)}, ${escapeSql(bi.taxAmount)}, ${escapeSql(bi.grandTotal)}, ${escapeSql(bi.createdAt)});\n`;
  }

  // 11. Bill Items
  const billItems = await prisma.billItem.findMany();
  sql += `\n-- 11. BILL LINE ITEMS\n`;
  for (const bit of billItems) {
    sql += `INSERT INTO "BillItem" ("id", "billId", "medicineId", "batchId", "quantity", "unitPrice", "gstRate", "usageInstructions", "doctorName", "customerType", "total", "createdAt") VALUES (${escapeSql(bit.id)}, ${escapeSql(bit.billId)}, ${escapeSql(bit.medicineId)}, ${escapeSql(bit.batchId)}, ${escapeSql(bit.quantity)}, ${escapeSql(bit.unitPrice)}, ${escapeSql(bit.gstRate)}, ${escapeSql(bit.usageInstructions)}, ${escapeSql(bit.doctorName)}, ${escapeSql(bit.customerType)}, ${escapeSql(bit.total)}, ${escapeSql(bit.createdAt)});\n`;
  }

  const outputPath = path.join(__dirname, '../../database/supabase_seed.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`✓ Generated Supabase SQL seed file: ${outputPath}`);
}

exportSeedSql()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
