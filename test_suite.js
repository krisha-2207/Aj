const axios = require('./frontend/node_modules/axios');

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:5173';

async function runTests() {
  console.log('===============================================================');
  console.log('  PHARMACY MANAGEMENT SYSTEM — AUTOMATED VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Frontend Server Liveness
    const feRes = await axios.get(FRONTEND_BASE);
    assert(feRes.status === 200 && feRes.data.includes('root'), 'Frontend dev server serving React app at http://localhost:5173');

    // 2. Backend Health
    const health = await axios.get(`${API_BASE}/health`);
    assert(health.status === 200 && health.data.currency === 'INR (₹)', 'Backend server running with INR (₹) localization');

    // 3. Login Tests
    // 3A. Owner Login
    const ownerLogin = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'owner@apollocare.com',
      password: 'admin123',
      role: 'OWNER'
    });
    const ownerToken = ownerLogin.data.token;
    assert(ownerLogin.status === 200 && ownerLogin.data.user.role === 'OWNER', 'Owner login successful (owner@apollocare.com)');

    // 3B. Staff Login
    const staffLogin = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'staff@apollocare.com',
      password: 'staff123',
      role: 'STAFF'
    });
    const staffToken = staffLogin.data.token;
    assert(staffLogin.status === 200 && staffLogin.data.user.role === 'STAFF', 'Staff login successful (staff@apollocare.com)');

    // 3C. Dealer Login
    const dealerLogin = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'dealer1@medisupply.com',
      password: 'dealer123',
      role: 'DEALER'
    });
    const dealerToken = dealerLogin.data.token;
    assert(dealerLogin.status === 200 && dealerLogin.data.user.role === 'DEALER', 'Dealer login successful (dealer1@medisupply.com)');

    // 4. Role-based Authorization / 403 Protection
    console.log('\n--- Role-Based Security Checks ---');
    try {
      await axios.get(`${API_BASE}/accounts/summary`, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      assert(false, 'Staff should be blocked from /api/accounts');
    } catch (err) {
      assert(err.response?.status === 403, 'Staff is blocked from accessing Owner Accounts (HTTP 403 Forbidden)');
    }

    try {
      await axios.get(`${API_BASE}/accounts/summary`, {
        headers: { Authorization: `Bearer ${dealerToken}` }
      });
      assert(false, 'Dealer should be blocked from /api/accounts');
    } catch (err) {
      assert(err.response?.status === 403, 'Dealer is blocked from accessing Owner Accounts (HTTP 403 Forbidden)');
    }

    const ownerAccounts = await axios.get(`${API_BASE}/accounts/summary`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(ownerAccounts.status === 200 && ownerAccounts.data.totalSalesRevenue !== undefined, 'Owner can access Accounts & Finance');

    // 5. Expiry Status & Batch Verification
    console.log('\n--- Batch-Wise Inventory & Dynamic Expiry Checks ---');
    const invRes = await axios.get(`${API_BASE}/inventory`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    const pBatches = invRes.data.batches.filter((b) => b.productId === 'MED001');
    const b1 = pBatches.find((b) => b.batchNumber === 'BATCH001');
    const b2 = pBatches.find((b) => b.batchNumber === 'BATCH002');
    const b3 = pBatches.find((b) => b.batchNumber === 'BATCH003');

    assert(b1 && b1.expiryStatus === 'EXPIRING_SOON', `Paracetamol Batch 1 (BATCH001) is EXPIRING_SOON (RED) [${b1?.daysRemaining} days left]`);
    assert(b2 && b2.expiryStatus === 'SAFE', `Paracetamol Batch 2 (BATCH002) is SAFE (GREEN) [${b2?.daysRemaining} days left]`);
    assert(b3 && b3.expiryStatus === 'EXPIRED', `Paracetamol Batch 3 (BATCH003) is EXPIRED (DARK RED) [${b3?.daysRemaining} days ago]`);

    // 6. Billing & Stock Deduction Test
    console.log('\n--- Billing & Atomic Stock Deduction Checks ---');
    const stockBefore = b1.remainingQuantity;
    const soldBefore = b1.soldQuantity;

    const billPayload = {
      customerName: 'Suresh Raina',
      customerPhone: '+91 98450 99887',
      paymentMethod: 'UPI',
      discount: 10,
      items: [
        {
          medicineId: b1.medicineId,
          batchId: b1.id,
          quantity: 3,
          unitPrice: b1.sellingPrice,
          gstRate: 12.0
        }
      ]
    };

    const billRes = await axios.post(`${API_BASE}/bills`, billPayload, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    assert(billRes.status === 201 && billRes.data.bill?.billNumber.startsWith('INV-'), `Bill created: ${billRes.data.bill?.billNumber}`);
    assert(billRes.data.bill?.customerName === 'Suresh Raina', 'Customer linked correctly to bill');
    assert(
      Boolean(billRes.data.bill?.items?.[0]?.usageInstructions),
      `Bill item contains medicine usage instructions: "${billRes.data.bill?.items?.[0]?.usageInstructions}"`
    );

    // Verify stock deduction in DB
    const invAfter = await axios.get(`${API_BASE}/inventory`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const b1After = invAfter.data.batches.find((b) => b.id === b1.id);
    assert(b1After.remainingQuantity === stockBefore - 3, `Stock deducted: was ${stockBefore}, now ${b1After.remainingQuantity}`);
    assert(b1After.soldQuantity === soldBefore + 3, `Sold qty increased: was ${soldBefore}, now ${b1After.soldQuantity}`);

    // Prevent Expired Batch Billing
    try {
      await axios.post(`${API_BASE}/bills`, {
        customerName: 'Test Expired',
        customerPhone: '+91 99999 11111',
        paymentMethod: 'CASH',
        items: [{ medicineId: b3.medicineId, batchId: b3.id, quantity: 1, unitPrice: 20 }]
      }, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      assert(false, 'Should prevent billing expired medicine');
    } catch (err) {
      assert(err.response?.status === 400, 'Expired batch strictly blocked from billing (HTTP 400)');
    }

    // 7. Dealer Supply -> Auto Inventory Sync Test
    console.log('\n--- Dealer Supply -> Inventory Auto-Sync Checks ---');
    const uniqueBatchNumber = `DEALER-TEST-${Date.now()}`;
    const supplyRes = await axios.post(`${API_BASE}/dealers/my-portal/supply`, {
      medicineId: b1.medicineId,
      batchNumber: uniqueBatchNumber,
      quantity: 25,
      purchasePrice: 15.5,
      sellingPrice: 25.0,
      mfgDate: '2026-08-01',
      expiryDate: '2027-12-31'
    }, {
      headers: { Authorization: `Bearer ${dealerToken}` }
    });

    assert(supplyRes.status === 201, 'Dealer registered supply shipment successfully');

    // Verify batch appears in pharmacy inventory
    const invCheck = await axios.get(`${API_BASE}/inventory`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const autoBatch = invCheck.data.batches.find((b) => b.batchNumber === uniqueBatchNumber);
    assert(autoBatch && autoBatch.remainingQuantity === 25, 'Supplied batch automatically appears in Pharmacy Inventory with 25 units');

    // 8. Doctor Name & Prescribing Doctor Association in Billing
    console.log('\n--- Doctor Name & Prescribing Doctor Verification ---');
    const doctorBillPayload = {
      customerName: 'Anitha Rajan',
      customerPhone: '+91 94433 22110',
      doctorName: 'Dr. Ramesh Sharma (Cardiologist, MD)',
      paymentMethod: 'CASH',
      discount: 0,
      items: [
        {
          medicineId: b2.medicineId,
          batchId: b2.id,
          quantity: 1,
          unitPrice: b2.sellingPrice,
          gstRate: 12.0
        }
      ]
    };

    const docBillRes = await axios.post(`${API_BASE}/bills`, doctorBillPayload, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    assert(docBillRes.status === 201, 'Bill created with doctor association successfully');
    assert(docBillRes.data.bill?.doctorName === 'Dr. Ramesh Sharma (Cardiologist, MD)', `Doctor Name saved on bill: "${docBillRes.data.bill?.doctorName}"`);
    assert(docBillRes.data.bill?.items?.[0]?.doctorName === 'Dr. Ramesh Sharma (Cardiologist, MD)', `Doctor Name saved on bill item: "${docBillRes.data.bill?.items?.[0]?.doctorName}"`);

    // 9. GST & Reverse Logistics Analytics (Purchase GST, Sales GST, Returns)
    console.log('\n--- GST Accounting & Return Logistics Checks ---');
    const ownerDash = await axios.get(`${API_BASE}/dashboard/owner`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    assert(ownerDash.status === 200, 'Owner dashboard analytics fetched');
    const kpis = ownerDash.data.kpis;
    assert(typeof kpis.salesGst === 'number', `Sales GST (Output Tax) calculated: ₹${kpis.salesGst}`);
    assert(typeof kpis.purchaseGst === 'number', `Purchase GST (Input Tax Credit) calculated: ₹${kpis.purchaseGst}`);
    assert(typeof kpis.salesReturnTotal === 'number', `Sales Returns total calculated: ₹${kpis.salesReturnTotal}`);
    assert(typeof kpis.purchaseReturnTotal === 'number', `Purchase Returns total calculated: ₹${kpis.purchaseReturnTotal}`);
    assert(typeof kpis.netGstLiability === 'number', `Net GST Balance calculated: ₹${kpis.netGstLiability}`);

    // Verify recent transactions include doctorName
    const hasDocInTx = ownerDash.data.recentTransactions.some(tx => tx.doctorName);
    assert(hasDocInTx, 'Recent transactions in Owner Dashboard correctly display Doctor Name');

    // 10. Sales Returns and Purchase Returns Endpoints
    console.log('\n--- Sales Return & Purchase Return Endpoints ---');
    const salesReturnsRes = await axios.get(`${API_BASE}/bills/returns/sales`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const salesReturnsList = Array.isArray(salesReturnsRes.data) ? salesReturnsRes.data : salesReturnsRes.data.returns;
    assert(salesReturnsRes.status === 200 && Array.isArray(salesReturnsList), `Sales Returns fetched: ${salesReturnsList?.length} records`);
    if (salesReturnsList && salesReturnsList.length > 0) {
      assert(Boolean(salesReturnsList[0].doctorName), `Sales return record tracks Prescribing Doctor: "${salesReturnsList[0].doctorName}"`);
    }

    const purchaseReturnsRes = await axios.get(`${API_BASE}/purchase-orders/returns/purchase`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const purchaseReturnsList = Array.isArray(purchaseReturnsRes.data) ? purchaseReturnsRes.data : purchaseReturnsRes.data.returns;
    assert(purchaseReturnsRes.status === 200 && Array.isArray(purchaseReturnsList), `Purchase Returns fetched: ${purchaseReturnsList?.length} records`);
    if (purchaseReturnsList && purchaseReturnsList.length > 0) {
      assert(Boolean(purchaseReturnsList[0].dealerName || purchaseReturnsList[0].dealer?.companyName), `Purchase return record tracks Supplier/Dealer name: "${purchaseReturnsList[0].dealer?.companyName || purchaseReturnsList[0].dealerName}"`);
    }

    // 11. New Customer vs Existing Customer Billing Checks
    console.log('\n--- New Customer vs Existing Customer Billing Checks ---');
    const uniquePhone = `+91 91234 ${Math.floor(10000 + Math.random() * 90000)}`;
    const newCustomerPayload = {
      customerType: 'NEW',
      customerName: 'Kavitha Ramachandran',
      customerPhone: uniquePhone,
      customerAddress: 'Flat 402, Palm Meadows, Whitefield, Bengaluru',
      customerAge: 34,
      customerGender: 'Female',
      customerEmail: 'kavitha.r@gmail.com',
      doctorName: 'Dr. Priya Nair (Pedia)',
      paymentMethod: 'UPI',
      discount: 5,
      items: [
        {
          medicineId: b2.medicineId,
          batchId: b2.id,
          quantity: 1,
          unitPrice: b2.sellingPrice,
          gstRate: 12.0
        }
      ]
    };

    const newCustBillRes = await axios.post(`${API_BASE}/bills`, newCustomerPayload, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    assert(newCustBillRes.status === 201, 'Bill generated for New Customer successfully');
    assert(newCustBillRes.data.bill?.customerType === 'NEW', `Customer Type stored on bill as: "${newCustBillRes.data.bill?.customerType}"`);
    assert(newCustBillRes.data.bill?.customerAddress === 'Flat 402, Palm Meadows, Whitefield, Bengaluru', `Customer Address stored on bill: "${newCustBillRes.data.bill?.customerAddress}"`);
    assert(newCustBillRes.data.bill?.customerAge === 34, `Customer Age stored on bill: ${newCustBillRes.data.bill?.customerAge}`);

    // Verify customer registered in database and searchable
    const searchRes = await axios.get(`${API_BASE}/bills/customers`, {
      params: { search: uniquePhone },
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(searchRes.status === 200 && searchRes.data.length > 0, `New customer automatically saved in database and searchable by phone: ${searchRes.data[0]?.name}`);
    const registeredCust = searchRes.data[0];
    assert(registeredCust.customerCode?.startsWith('CUST-'), `Auto-assigned Customer ID Code: "${registeredCust.customerCode}"`);

    // Bill second time for the same customer as EXISTING
    const existingCustPayload = {
      customerType: 'EXISTING',
      customerName: registeredCust.name,
      customerPhone: registeredCust.phone,
      customerAddress: registeredCust.address,
      doctorName: 'Dr. Ramesh Sharma (Cardio)',
      paymentMethod: 'CASH',
      discount: 0,
      items: [
        {
          medicineId: b2.medicineId,
          batchId: b2.id,
          quantity: 1,
          unitPrice: b2.sellingPrice,
          gstRate: 12.0
        }
      ]
    };

    const existingBillRes = await axios.post(`${API_BASE}/bills`, existingCustPayload, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    assert(existingBillRes.status === 201, 'Bill generated for Existing Customer successfully');
    assert(existingBillRes.data.bill?.customerType === 'EXISTING', `Customer Type stored as: "${existingBillRes.data.bill?.customerType}"`);

    // Verify visits incremented to 2
    const verifyCustRes = await axios.get(`${API_BASE}/bills/customers`, {
      params: { search: uniquePhone },
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(verifyCustRes.data[0]?.totalVisits === 2, `Customer visit count updated: ${verifyCustRes.data[0]?.totalVisits} visits on file`);

    console.log('\n===============================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');
  } catch (error) {
    console.error('Test Suite Fatal Error:', error.response?.data || error.message);
  }
}

runTests();
