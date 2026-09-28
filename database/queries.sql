-- ============================================================================
-- PHARMAFLOW: PHARMACY MANAGEMENT & MEDICAL SUPPLY SYSTEM
-- COMPLETE PRODUCTION QUERY CATALOG & QUERY ANALYSIS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FEFO INVENTORY & DYNAMIC EXPIRY DETECTION QUERY
-- Rules:
--   - < 0 days remaining: 'EXPIRED' (DARK RED - Blocked from Billing)
--   - <= 60 days remaining: 'EXPIRING_SOON' (RED - High Priority Dispatch)
--   - > 60 days remaining: 'SAFE' (GREEN - Safe stock)
-- ----------------------------------------------------------------------------
SELECT 
    b.id AS batch_id,
    b."batchNumber",
    m."productId",
    m.name AS medicine_name,
    m."genericName",
    m.category,
    m."dosageForm",
    b."remainingQuantity",
    b."soldQuantity",
    b."purchasePrice",
    b."sellingPrice",
    b."expiryDate",
    d."companyName" AS supplier_name,
    EXTRACT(DAY FROM (b."expiryDate" - CURRENT_TIMESTAMP))::INTEGER AS days_remaining,
    CASE 
        WHEN b."expiryDate" < CURRENT_TIMESTAMP THEN 'EXPIRED'
        WHEN b."expiryDate" <= (CURRENT_TIMESTAMP + INTERVAL '60 days') THEN 'EXPIRING_SOON'
        ELSE 'SAFE'
    END AS expiry_status,
    CASE 
        WHEN b."remainingQuantity" = 0 THEN 'OUT_OF_STOCK'
        WHEN b."remainingQuantity" <= m."minStockLevel" THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM "MedicineBatch" b
JOIN "Medicine" m ON b."medicineId" = m.id
LEFT JOIN "Dealer" d ON b."dealerId" = d.id
ORDER BY b."expiryDate" ASC; -- FEFO (First Expiry, First Out)

-- ----------------------------------------------------------------------------
-- 2. DEALER DISPATCH & TABLET REQUIREMENTS QUERY
-- Calculates exact tablets to be dispatched from each supplier
-- ----------------------------------------------------------------------------
SELECT 
    d.id AS dealer_id,
    d."companyName",
    d."contactPerson",
    d.phone,
    d.email,
    d.gstin,
    COUNT(DISTINCT po.id) AS active_orders_count,
    COALESCE(SUM(poi.quantity), 0) AS total_tablets_to_dispatch,
    COALESCE(SUM(poi.quantity * poi."purchasePrice"), 0.0) AS total_consignment_value,
    COUNT(DISTINCT mb.id) AS total_batches_supplied,
    COALESCE(SUM(mb."remainingQuantity"), 0) AS current_stock_in_pharmacy
FROM "Dealer" d
LEFT JOIN "PurchaseOrder" po ON d.id = po."dealerId" 
    AND po.status IN ('PENDING', 'APPROVED', 'DISPATCHED')
LEFT JOIN "PurchaseOrderItem" poi ON po.id = poi."purchaseOrderId"
LEFT JOIN "MedicineBatch" mb ON d.id = mb."dealerId"
GROUP BY d.id, d."companyName", d."contactPerson", d.phone, d.email, d.gstin
ORDER BY total_tablets_to_dispatch DESC;

-- ----------------------------------------------------------------------------
-- 3. SPECIFIC DEALER DISPATCH LINE ITEMS QUERY
-- Detailed line-by-line tablet dispatch requirement for a given dealer
-- ----------------------------------------------------------------------------
SELECT 
    po."orderNumber",
    po.status AS order_status,
    po."orderDate",
    m."productId",
    m.name AS medicine_name,
    m."dosageForm",
    m.strength,
    poi."batchNumber",
    poi.quantity AS tablets_to_dispatch,
    poi."purchasePrice",
    (poi.quantity * poi."purchasePrice") AS total_cost,
    poi."expiryDate" AS expected_expiry
FROM "PurchaseOrderItem" poi
JOIN "PurchaseOrder" po ON poi."purchaseOrderId" = po.id
JOIN "Medicine" m ON poi."medicineId" = m.id
WHERE po."dealerId" = :dealer_id
  AND po.status IN ('PENDING', 'APPROVED', 'DISPATCHED')
ORDER BY po."orderDate" DESC;

-- ----------------------------------------------------------------------------
-- 4. LOW STOCK & REPLENISHMENT DISPATCH ALERTS QUERY
-- Identifies medicines requiring supplier replenishment orders
-- ----------------------------------------------------------------------------
SELECT 
    m."productId",
    m.name AS medicine_name,
    m."genericName",
    m.category,
    m."minStockLevel",
    COALESCE(SUM(b."remainingQuantity"), 0) AS current_stock,
    GREATEST(50, (m."minStockLevel" * 4) - COALESCE(SUM(b."remainingQuantity"), 0)) AS recommended_order_tablets,
    CASE 
        WHEN COALESCE(SUM(b."remainingQuantity"), 0) = 0 THEN 'OUT OF STOCK'
        WHEN COALESCE(SUM(b."remainingQuantity"), 0) <= m."minStockLevel" THEN 'LOW STOCK'
    END AS urgency_reason,
    d."companyName" AS preferred_supplier
FROM "Medicine" m
LEFT JOIN "MedicineBatch" b ON m.id = b."medicineId"
LEFT JOIN "Dealer" d ON b."dealerId" = d.id
GROUP BY m.id, m."productId", m.name, m."genericName", m.category, m."minStockLevel", d."companyName"
HAVING COALESCE(SUM(b."remainingQuantity"), 0) <= m."minStockLevel"
ORDER BY current_stock ASC;

-- ----------------------------------------------------------------------------
-- 5. ATOMIC POS BILLING & STOCK DEDUCTION TRANSACTION QUERY
-- ----------------------------------------------------------------------------
-- Step A: Insert Bill Header
INSERT INTO "Bill" (
    "id", "billNumber", "pharmacyId", "staffId", "customerId",
    "customerName", "customerPhone", "customerType", "customerAddress",
    "customerAge", "doctorName", "paymentMethod", "subtotal", "discount",
    "taxAmount", "grandTotal", "createdAt"
) VALUES (
    gen_random_uuid()::text, :bill_number, :pharmacy_id, :staff_id, :customer_id,
    :customer_name, :customer_phone, :customer_type, :customer_address,
    :customer_age, :doctor_name, :payment_method, :subtotal, :discount,
    :tax_amount, :grand_total, CURRENT_TIMESTAMP
);

-- Step B: Insert Bill Line Item with Doctor Name & Usage Instructions
INSERT INTO "BillItem" (
    "id", "billId", "medicineId", "batchId", "quantity",
    "unitPrice", "gstRate", "usageInstructions", "doctorName", "customerType", "total"
) VALUES (
    gen_random_uuid()::text, :bill_id, :medicine_id, :batch_id, :quantity,
    :unit_price, :gst_rate, :usage_instructions, :doctor_name, :customer_type, :line_total
);

-- Step C: Atomic FEFO Batch Deduction
UPDATE "MedicineBatch"
SET 
    "remainingQuantity" = "remainingQuantity" - :quantity,
    "soldQuantity" = "soldQuantity" + :quantity,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = :batch_id 
  AND "remainingQuantity" >= :quantity
  AND "expiryDate" >= CURRENT_TIMESTAMP; -- Guard: Expired batch blocked

-- ----------------------------------------------------------------------------
-- 6. OWNER FINANCIAL LEDGER & GST LIABILITY QUERY
-- ----------------------------------------------------------------------------
WITH sales_summary AS (
    SELECT 
        COALESCE(SUM("subtotal"), 0.0) AS gross_sales,
        COALESCE(SUM("taxAmount"), 0.0) AS total_output_gst,
        COALESCE(SUM("discount"), 0.0) AS total_discounts,
        COALESCE(SUM("grandTotal"), 0.0) AS net_revenue,
        COUNT(id) AS total_bills_count
    FROM "Bill"
),
purchase_summary AS (
    SELECT 
        COALESCE(SUM("totalAmount"), 0.0) AS total_purchases,
        COALESCE(SUM("totalAmount" * 0.12), 0.0) AS total_input_gst_credit
    FROM "PurchaseOrder"
    WHERE status IN ('RECEIVED', 'COMPLETED')
),
expense_summary AS (
    SELECT COALESCE(SUM(amount), 0.0) AS total_operational_expenses
    FROM "Expense"
),
sales_returns_summary AS (
    SELECT 
        COALESCE(SUM("refundAmount"), 0.0) AS total_sales_refunds,
        COALESCE(SUM("gstRefund"), 0.0) AS total_sales_gst_refund
    FROM "SalesReturn"
),
purchase_returns_summary AS (
    SELECT 
        COALESCE(SUM("refundAmount"), 0.0) AS total_purchase_returns,
        COALESCE(SUM("gstReversal"), 0.0) AS total_purchase_gst_reversal
    FROM "PurchaseReturn"
)
SELECT 
    s.net_revenue,
    p.total_purchases,
    e.total_operational_expenses,
    s.total_output_gst AS output_sales_gst,
    p.total_input_gst_credit AS input_purchase_gst,
    (s.total_output_gst - p.total_input_gst_credit - sr.total_sales_gst_refund + pr.total_purchase_gst_reversal) AS net_gst_liability,
    (s.net_revenue - p.total_purchases - e.total_operational_expenses - sr.total_sales_refunds + pr.total_purchase_returns) AS net_profit
FROM sales_summary s, purchase_summary p, expense_summary e, sales_returns_summary sr, purchase_returns_summary pr;

-- ----------------------------------------------------------------------------
-- 7. TOP SELLING MEDICINES & CONSUMPTION VELOCITY QUERY
-- ----------------------------------------------------------------------------
SELECT 
    m."productId",
    m.name AS medicine_name,
    m.category,
    SUM(bi.quantity) AS total_tablets_sold,
    SUM(bi.total) AS total_sales_value,
    COUNT(DISTINCT bi."billId") AS unique_invoices_count
FROM "BillItem" bi
JOIN "Medicine" m ON bi."medicineId" = m.id
GROUP BY m.id, m."productId", m.name, m.category
ORDER BY total_tablets_sold DESC
LIMIT 10;
