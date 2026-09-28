const { supabaseAdmin } = require('../src/utils/supabase');

async function seedBatches() {
  const pharmacyId = '4752fc09-bcd9-4395-923f-0d4b526c0d3a';
  const dealerId = '15cc4a26-c485-48cb-9b7f-40302517682e';

  const sampleMeds = [
    {
      prodId: 'MED001',
      name: 'Paracetamol 500mg',
      batch1: { batchNumber: 'PCM-2026-BATCH1', expiryDate: '2026-10-25T00:00:00', remainingQuantity: 40, purchasePrice: 15, sellingPrice: 24 },
      batch2: { batchNumber: 'PCM-2028-BATCH2', expiryDate: '2028-06-30T00:00:00', remainingQuantity: 150, purchasePrice: 16, sellingPrice: 26 }
    },
    {
      prodId: 'MED002',
      name: 'Paracetamol 650mg',
      batch1: { batchNumber: 'DOLO-2026-BATCH1', expiryDate: '2026-11-05T00:00:00', remainingQuantity: 35, purchasePrice: 20, sellingPrice: 32 },
      batch2: { batchNumber: 'DOLO-2028-BATCH2', expiryDate: '2028-08-15T00:00:00', remainingQuantity: 120, purchasePrice: 22, sellingPrice: 35 }
    },
    {
      prodId: 'MED010',
      name: 'Metformin 500mg',
      batch1: { batchNumber: 'MET-2026-BATCH1', expiryDate: '2026-10-30T00:00:00', remainingQuantity: 45, purchasePrice: 18, sellingPrice: 30 },
      batch2: { batchNumber: 'MET-2028-BATCH2', expiryDate: '2028-05-20T00:00:00', remainingQuantity: 110, purchasePrice: 19, sellingPrice: 31 }
    },
    {
      prodId: 'MED006',
      name: 'Amoxicillin 500mg',
      batch1: { batchNumber: 'AMX-2026-BATCH1', expiryDate: '2026-11-12T00:00:00', remainingQuantity: 25, purchasePrice: 55, sellingPrice: 85 },
      batch2: { batchNumber: 'AMX-2028-BATCH2', expiryDate: '2028-09-10T00:00:00', remainingQuantity: 80, purchasePrice: 60, sellingPrice: 92 }
    },
    {
      prodId: 'MED008',
      name: 'Pantoprazole 40mg',
      batch1: { batchNumber: 'PAN-2026-BATCH1', expiryDate: '2026-10-18T00:00:00', remainingQuantity: 30, purchasePrice: 45, sellingPrice: 70 },
      batch2: { batchNumber: 'PAN-2028-BATCH2', expiryDate: '2028-11-25T00:00:00', remainingQuantity: 95, purchasePrice: 48, sellingPrice: 75 }
    },
    {
      prodId: 'MED004',
      name: 'Cetirizine 10mg',
      batch1: { batchNumber: 'CET-2026-BATCH1', expiryDate: '2026-11-01T00:00:00', remainingQuantity: 50, purchasePrice: 10, sellingPrice: 18 },
      batch2: { batchNumber: 'CET-2028-BATCH2', expiryDate: '2028-04-15T00:00:00', remainingQuantity: 140, purchasePrice: 12, sellingPrice: 20 }
    },
    {
      prodId: 'MED007',
      name: 'Azithromycin 500mg',
      batch1: { batchNumber: 'AZI-2026-BATCH1', expiryDate: '2026-10-28T00:00:00', remainingQuantity: 20, purchasePrice: 80, sellingPrice: 115 },
      batch2: { batchNumber: 'AZI-2028-BATCH2', expiryDate: '2028-07-20T00:00:00', remainingQuantity: 75, purchasePrice: 85, sellingPrice: 125 }
    }
  ];

  for (const item of sampleMeds) {
    const { data: med } = await supabaseAdmin.from('Medicine').select('id').eq('productId', item.prodId).single();
    if (!med) {
      console.log('Med not found:', item.prodId);
      continue;
    }

    // Insert Batch 1 (Near-by expire: within ~30-45 days, marked Expiring Soon)
    const b1 = {
      medicineId: med.id,
      pharmacyId,
      dealerId,
      batchNumber: item.batch1.batchNumber,
      expiryDate: item.batch1.expiryDate,
      mfgDate: '2025-01-01T00:00:00',
      initialQuantity: item.batch1.remainingQuantity + 10,
      soldQuantity: 10,
      remainingQuantity: item.batch1.remainingQuantity,
      purchasePrice: item.batch1.purchasePrice,
      sellingPrice: item.batch1.sellingPrice,
      receivedDate: '2025-06-01T00:00:00'
    };

    // Insert Batch 2 (Far-away expire: in 2028, Safe)
    const b2 = {
      medicineId: med.id,
      pharmacyId,
      dealerId,
      batchNumber: item.batch2.batchNumber,
      expiryDate: item.batch2.expiryDate,
      mfgDate: '2026-01-01T00:00:00',
      initialQuantity: item.batch2.remainingQuantity,
      soldQuantity: 0,
      remainingQuantity: item.batch2.remainingQuantity,
      purchasePrice: item.batch2.purchasePrice,
      sellingPrice: item.batch2.sellingPrice,
      receivedDate: '2026-01-15T00:00:00'
    };

    // Clean any old matching batch numbers first
    await supabaseAdmin.from('MedicineBatch').delete().eq('medicineId', med.id).in('batchNumber', [b1.batchNumber, b2.batchNumber]);

    const { error: e1 } = await supabaseAdmin.from('MedicineBatch').insert([b1]);
    const { error: e2 } = await supabaseAdmin.from('MedicineBatch').insert([b2]);

    console.log(`Configured Batches for ${item.name} (${item.prodId}): Batch 1 (${b1.batchNumber}) & Batch 2 (${b2.batchNumber}) | e1: ${e1?.message || 'OK'} | e2: ${e2?.message || 'OK'}`);
  }
}

seedBatches().then(() => console.log('All demo batches added successfully!'));
