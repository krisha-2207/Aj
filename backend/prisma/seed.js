const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log(' PharmaFlow: Seeding Comprehensive Demo Dataset (50 Medicines)');
  console.log('====================================================');

  // Clean existing tables in reverse dependency order (idempotent clean & reseed)
  await prisma.salesReturn.deleteMany();
  await prisma.purchaseReturn.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.medicineBatch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pharmacy.deleteMany();

  // 1. Create Pharmacy
  const pharmacy = await prisma.pharmacy.create({
    data: {
      name: 'PharmaFlow Retail Medical Store',
      address: '#42, 100ft Ring Road, Indiranagar, Bengaluru, Karnataka - 560038',
      phone: '+91 80 2528 9000',
      email: 'store@pharmaflow.com',
      gstin: '29AAAAA0000A1Z5',
      dlNumber: 'KA-B1-20B-102934 / 21B-102935'
    }
  });
  console.log('✓ Created Pharmacy:', pharmacy.name);

  // 2. Passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const dealerPassword = await bcrypt.hash('dealer123', 10);

  // 3. Create Users
  // Pharmacy Owner
  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@apollocare.com',
      username: 'owner',
      password: adminPassword,
      name: 'Dr. Rajesh Sharma',
      role: 'OWNER',
      phone: '+91 98450 11111',
      pharmacyId: pharmacy.id
    }
  });

  // Staff (Pharmacist)
  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@apollocare.com',
      username: 'staff',
      password: staffPassword,
      name: 'Kavita Reddy',
      role: 'STAFF',
      phone: '+91 98450 22222',
      pharmacyId: pharmacy.id
    }
  });

  await prisma.staff.create({
    data: {
      userId: staffUser.id,
      employeeCode: 'STF-101',
      designation: 'Licensed Retail Pharmacist',
      salary: 35000.0,
      joinedDate: new Date('2024-01-15')
    }
  });

  // Dealer 1 (MediSupply India)
  const dealer1User = await prisma.user.create({
    data: {
      email: 'dealer1@medisupply.com',
      username: 'dealer1',
      password: dealerPassword,
      name: 'Vikram Mehta',
      role: 'DEALER',
      phone: '+91 98451 22334',
      pharmacyId: pharmacy.id
    }
  });

  const dealer1 = await prisma.dealer.create({
    data: {
      userId: dealer1User.id,
      companyName: 'MediSupply India Pvt Ltd',
      contactPerson: 'Vikram Mehta',
      phone: '+91 98451 22334',
      email: 'dealer1@medisupply.com',
      gstin: '29AABCM1234F1Z1',
      dlNumber: 'KA-B1-20B-887766',
      address: 'Industrial Area, Peenya, Bengaluru, Karnataka - 560058'
    }
  });

  // Dealer 2 (Zenith Pharma Distributors)
  const dealer2User = await prisma.user.create({
    data: {
      email: 'dealer2@zenithpharma.com',
      username: 'dealer2',
      password: dealerPassword,
      name: 'Suresh Gupta',
      role: 'DEALER',
      phone: '+91 99887 76655',
      pharmacyId: pharmacy.id
    }
  });

  const dealer2 = await prisma.dealer.create({
    data: {
      userId: dealer2User.id,
      companyName: 'Zenith Pharma Distributors',
      contactPerson: 'Suresh Gupta',
      phone: '+91 99887 76655',
      email: 'dealer2@zenithpharma.com',
      gstin: '29AABCZ5678G2Z2',
      dlNumber: 'KA-B1-20B-998811',
      address: 'Wilson Garden, Hosur Road, Bengaluru, Karnataka - 560027'
    }
  });

  console.log('✓ Created Core Portals: Owner, Staff, Dealer 1, Dealer 2');

  // 4. Exact 50 Medicines Definition (Section 26 Requirements)
  const medicines50 = [
    { id: 'MED001', name: 'Paracetamol 500mg', generic: 'Paracetamol', cat: 'Analgesics / Antipyretic', form: 'Tablet', strength: '500mg', mfr: 'Apex Laboratories', use: 'Fever & mild pain relief', minStock: 25, price: 15.0, mrp: 25.0, gst: 12.0 },
    { id: 'MED002', name: 'Paracetamol 650mg', generic: 'Paracetamol 650mg', cat: 'Analgesics / Antipyretic', form: 'Tablet', strength: '650mg', mfr: 'Micro Labs Ltd (Dolo)', use: 'High fever and bodily ache', minStock: 30, price: 20.0, mrp: 33.5, gst: 12.0 },
    { id: 'MED003', name: 'Ibuprofen 400mg', generic: 'Ibuprofen', cat: 'NSAID / Pain Relief', form: 'Tablet', strength: '400mg', mfr: 'Abbott Healthcare', use: 'Inflammation, toothache & headache', minStock: 20, price: 18.0, mrp: 29.0, gst: 12.0 },
    { id: 'MED004', name: 'Cetirizine 10mg', generic: 'Cetirizine Dihydrochloride', cat: 'Antihistamines', form: 'Tablet', strength: '10mg', mfr: "Dr. Reddy's Laboratories", use: 'Allergies, sneezing & runny nose', minStock: 20, price: 12.0, mrp: 21.0, gst: 12.0 },
    { id: 'MED005', name: 'Levocetirizine 5mg', generic: 'Levocetirizine', cat: 'Antihistamines', form: 'Tablet', strength: '5mg', mfr: 'Cipla Ltd', use: 'Seasonal allergic rhinitis', minStock: 15, price: 25.0, mrp: 42.0, gst: 12.0 },
    { id: 'MED006', name: 'Amoxicillin 500mg', generic: 'Amoxicillin Trihydrate', cat: 'Antibiotics', form: 'Capsule', strength: '500mg', mfr: 'GlaxoSmithKline', use: 'Bacterial infections', minStock: 20, price: 55.0, mrp: 85.0, gst: 12.0 },
    { id: 'MED007', name: 'Azithromycin 500mg', generic: 'Azithromycin', cat: 'Antibiotics', form: 'Tablet', strength: '500mg', mfr: 'Alembic Pharmaceuticals', use: 'Respiratory & throat infections', minStock: 15, price: 72.0, mrp: 119.0, gst: 12.0 },
    { id: 'MED008', name: 'Pantoprazole 40mg', generic: 'Pantoprazole Sodium', cat: 'Antacids / Gastrointestinal', form: 'Tablet', strength: '40mg', mfr: 'Aristo Pharmaceuticals', use: 'Acidity, heartburn & GERD', minStock: 25, price: 50.0, mrp: 82.5, gst: 12.0 },
    { id: 'MED009', name: 'Omeprazole 20mg', generic: 'Omeprazole', cat: 'Antacids / Gastrointestinal', form: 'Capsule', strength: '20mg', mfr: 'Zydus Cadila', use: 'Gastric ulcers & acid reflux', minStock: 20, price: 30.0, mrp: 48.0, gst: 12.0 },
    { id: 'MED010', name: 'Metformin 500mg', generic: 'Metformin Hydrochloride', cat: 'Antidiabetic', form: 'Tablet', strength: '500mg', mfr: 'USV Pvt Ltd', use: 'Blood glucose regulation (Type 2)', minStock: 30, price: 18.0, mrp: 30.0, gst: 5.0 },
    { id: 'MED011', name: 'Metformin 850mg', generic: 'Metformin Hydrochloride', cat: 'Antidiabetic', form: 'Tablet', strength: '850mg', mfr: 'Sanofi India', use: 'Advanced glycemic control', minStock: 15, price: 28.0, mrp: 46.0, gst: 5.0 },
    { id: 'MED012', name: 'Amlodipine 5mg', generic: 'Amlodipine Besylate', cat: 'Cardiovascular', form: 'Tablet', strength: '5mg', mfr: 'Pfizer India', use: 'Hypertension & angina prevention', minStock: 20, price: 14.0, mrp: 24.5, gst: 12.0 },
    { id: 'MED013', name: 'Amlodipine 10mg', generic: 'Amlodipine Besylate', cat: 'Cardiovascular', form: 'Tablet', strength: '10mg', mfr: 'Torrent Pharmaceuticals', use: 'High blood pressure management', minStock: 15, price: 22.0, mrp: 38.0, gst: 12.0 },
    { id: 'MED014', name: 'Losartan 50mg', generic: 'Losartan Potassium', cat: 'Cardiovascular', form: 'Tablet', strength: '50mg', mfr: 'Sun Pharma', use: 'Hypertension and kidney protection', minStock: 15, price: 32.0, mrp: 54.0, gst: 12.0 },
    { id: 'MED015', name: 'Atorvastatin 10mg', generic: 'Atorvastatin Calcium', cat: 'Cardiovascular / Statins', form: 'Tablet', strength: '10mg', mfr: 'Zydus Healthcare', use: 'Cholesterol & cardiovascular risk reduction', minStock: 25, price: 42.0, mrp: 70.0, gst: 12.0 },
    { id: 'MED016', name: 'Atorvastatin 20mg', generic: 'Atorvastatin Calcium', cat: 'Cardiovascular / Statins', form: 'Tablet', strength: '20mg', mfr: 'Sun Pharma (Storvas)', use: 'High lipid & plaque reduction', minStock: 15, price: 68.0, mrp: 110.0, gst: 12.0 },
    { id: 'MED017', name: 'Montelukast 10mg', generic: 'Montelukast Sodium', cat: 'Respiratory', form: 'Tablet', strength: '10mg', mfr: 'Cipla Ltd', use: 'Asthma maintenance & allergy relief', minStock: 15, price: 48.0, mrp: 80.0, gst: 12.0 },
    { id: 'MED018', name: 'Montelukast + Levocetirizine', generic: 'Montelukast + Levocetirizine', cat: 'Respiratory', form: 'Tablet', strength: '10mg+5mg', mfr: 'Sun Pharma (Montek-LC)', use: 'Chronic allergic rhinitis & bronchial spasms', minStock: 25, price: 78.0, mrp: 128.0, gst: 12.0 },
    { id: 'MED019', name: 'Diclofenac 50mg', generic: 'Diclofenac Sodium', cat: 'NSAID / Pain Relief', form: 'Tablet', strength: '50mg', mfr: 'Novartis India', use: 'Joint pain & inflammatory swelling', minStock: 20, price: 16.0, mrp: 28.0, gst: 12.0 },
    { id: 'MED020', name: 'Aceclofenac 100mg', generic: 'Aceclofenac', cat: 'NSAID / Pain Relief', form: 'Tablet', strength: '100mg', mfr: 'Alkem Laboratories', use: 'Osteoarthritis & spinal pain', minStock: 20, price: 26.0, mrp: 44.0, gst: 12.0 },
    { id: 'MED021', name: 'Domperidone 10mg', generic: 'Domperidone', cat: 'Gastrointestinal', form: 'Tablet', strength: '10mg', mfr: 'Torrent Pharmaceuticals', use: 'Nausea, vomiting & indigestion', minStock: 15, price: 18.0, mrp: 30.0, gst: 12.0 },
    { id: 'MED022', name: 'Ondansetron 4mg', generic: 'Ondansetron Hydrochloride', cat: 'Antiemetics', form: 'Tablet', strength: '4mg', mfr: 'GlaxoSmithKline (Emeset)', use: 'Prevention of acute nausea', minStock: 15, price: 28.0, mrp: 47.0, gst: 12.0 },
    { id: 'MED023', name: 'Rabeprazole 20mg', generic: 'Rabeprazole Sodium', cat: 'Antacids / Gastrointestinal', form: 'Tablet', strength: '20mg', mfr: 'Lupin Ltd', use: 'Peptic ulcer & acid secretion reduction', minStock: 20, price: 44.0, mrp: 74.0, gst: 12.0 },
    { id: 'MED024', name: 'Esomeprazole 40mg', generic: 'Esomeprazole Magnesium', cat: 'Antacids / Gastrointestinal', form: 'Tablet', strength: '40mg', mfr: 'Glenmark Pharmaceuticals', use: 'Severe gastro-esophageal reflux', minStock: 15, price: 62.0, mrp: 104.0, gst: 12.0 },
    { id: 'MED025', name: 'Famotidine 20mg', generic: 'Famotidine', cat: 'Antacids / H2 Blockers', form: 'Tablet', strength: '20mg', mfr: 'Cadila Pharmaceuticals', use: 'Stomach acid suppression', minStock: 10, price: 12.0, mrp: 20.0, gst: 12.0 },
    { id: 'MED026', name: 'Doxycycline 100mg', generic: 'Doxycycline Hyclate', cat: 'Antibiotics', form: 'Capsule', strength: '100mg', mfr: 'USV Pvt Ltd', use: 'Bacterial infections & skin acne', minStock: 15, price: 34.0, mrp: 58.0, gst: 12.0 },
    { id: 'MED027', name: 'Cefixime 200mg', generic: 'Cefixime Trihydrate', cat: 'Antibiotics', form: 'Tablet', strength: '20mg', mfr: 'Mankind Pharma (Mahacef)', use: 'Urinary tract & respiratory infections', minStock: 15, price: 65.0, mrp: 107.0, gst: 12.0 },
    { id: 'MED028', name: 'Ciprofloxacin 500mg', generic: 'Ciprofloxacin', cat: 'Antibiotics', form: 'Tablet', strength: '500mg', mfr: 'Cipla Ltd (Cifran)', use: 'Bacterial enteritis & skin infections', minStock: 15, price: 38.0, mrp: 64.0, gst: 12.0 },
    { id: 'MED029', name: 'ORS Sachet', generic: 'Oral Rehydration Salts IP', cat: 'Electrolytes', form: 'Sachet', strength: '21.8g', mfr: 'FDC Ltd (Electral)', use: 'Dehydration, diarrhoea & electrolyte replenishment', minStock: 40, price: 14.0, mrp: 23.5, gst: 12.0 },
    { id: 'MED030', name: 'Calcium + Vitamin D', generic: 'Calcium Carbonate + Vit D3', cat: 'Vitamins & Minerals', form: 'Tablet', strength: '500mg+250IU', mfr: 'Torrent Pharma (Shelcal)', use: 'Bone strength & osteoporosis support', minStock: 25, price: 72.0, mrp: 120.0, gst: 12.0 },
    { id: 'MED031', name: 'Vitamin B12', generic: 'Methylcobalamin', cat: 'Vitamins & Minerals', form: 'Tablet', strength: '1500mcg', mfr: 'Wockhardt Ltd', use: 'Nerve health & red blood cell formation', minStock: 20, price: 85.0, mrp: 145.0, gst: 12.0 },
    { id: 'MED032', name: 'Folic Acid', generic: 'Folic Acid IP', cat: 'Vitamins & Minerals', form: 'Tablet', strength: '5mg', mfr: 'Pfizer India', use: 'Folate deficiency & prenatal cell division', minStock: 20, price: 8.0, mrp: 15.0, gst: 12.0 },
    { id: 'MED033', name: 'Iron + Folic Acid', generic: 'Ferrous Ascorbate + Folic Acid', cat: 'Vitamins & Minerals', form: 'Tablet', strength: '100mg+1.5mg', mfr: 'Emcure Pharmaceuticals', use: 'Iron deficiency anaemia recovery', minStock: 25, price: 65.0, mrp: 110.0, gst: 12.0 },
    { id: 'MED034', name: 'Glimepiride 1mg', generic: 'Glimepiride', cat: 'Antidiabetic', form: 'Tablet', strength: '1mg', mfr: 'Sanofi India (Amaryl)', use: 'Stimulates pancreatic insulin secretion', minStock: 20, price: 32.0, mrp: 52.0, gst: 5.0 },
    { id: 'MED035', name: 'Glimepiride 2mg', generic: 'Glimepiride', cat: 'Antidiabetic', form: 'Tablet', strength: '2mg', mfr: 'Sanofi India', use: 'Advanced insulin management in Type 2', minStock: 15, price: 48.0, mrp: 78.0, gst: 5.0 },
    { id: 'MED036', name: 'Telmisartan 40mg', generic: 'Telmisartan', cat: 'Cardiovascular', form: 'Tablet', strength: '40mg', mfr: 'Glenmark Pharmaceuticals', use: 'Angiotensin receptor blocker for BP', minStock: 25, price: 40.0, mrp: 68.0, gst: 12.0 },
    { id: 'MED037', name: 'Telmisartan + Amlodipine', generic: 'Telmisartan + Amlodipine', cat: 'Cardiovascular', form: 'Tablet', strength: '40mg+5mg', mfr: 'Mankind Pharma (Telmikind-AM)', use: 'Combination therapy for resistant hypertension', minStock: 20, price: 58.0, mrp: 96.0, gst: 12.0 },
    { id: 'MED038', name: 'Bisoprolol 5mg', generic: 'Bisoprolol Fumarate', cat: 'Cardiovascular', form: 'Tablet', strength: '5mg', mfr: 'Merck Ltd (Concor)', use: 'Beta blocker for heart rate & hypertension', minStock: 15, price: 54.0, mrp: 88.0, gst: 12.0 },
    { id: 'MED039', name: 'Clopidogrel 75mg', generic: 'Clopidogrel Bisulfate', cat: 'Cardiovascular / Antiplatelet', form: 'Tablet', strength: '75mg', mfr: 'Sanofi India (Plavix)', use: 'Prevents blood clots & arterial thrombosis', minStock: 15, price: 62.0, mrp: 102.0, gst: 12.0 },
    { id: 'MED040', name: 'Aspirin 75mg', generic: 'Acetylsalicylic Acid (Low Dose)', cat: 'Cardiovascular / Antiplatelet', form: 'Tablet', strength: '75mg', mfr: 'Bayer India (Ecosprin)', use: 'Cardiovascular stroke & clot prophylaxis', minStock: 30, price: 6.0, mrp: 11.5, gst: 12.0 },
    { id: 'MED041', name: 'Levothyroxine 50mcg', generic: 'Thyroxine Sodium', cat: 'Hormonal / Thyroid', form: 'Tablet', strength: '50mcg', mfr: 'Abbott Healthcare (Thyronorm)', use: 'Hypothyroidism synthetic thyroid hormone replacement', minStock: 20, price: 82.0, mrp: 135.0, gst: 12.0 },
    { id: 'MED042', name: 'Levothyroxine 100mcg', generic: 'Thyroxine Sodium', cat: 'Hormonal / Thyroid', form: 'Tablet', strength: '100mcg', mfr: 'Abbott Healthcare', use: 'High dose thyroid substitution therapy', minStock: 15, price: 95.0, mrp: 155.0, gst: 12.0 },
    { id: 'MED043', name: 'Salbutamol', generic: 'Salbutamol Sulphate', cat: 'Respiratory', form: 'Inhaler / Respules', strength: '100mcg/actuation', mfr: 'Cipla Ltd (Asthalin)', use: 'Bronchospasm & acute asthma relief', minStock: 10, price: 78.0, mrp: 125.0, gst: 12.0 },
    { id: 'MED044', name: 'Ambroxol', generic: 'Ambroxol Hydrochloride', cat: 'Respiratory / Mucolytic', form: 'Syrup / Tab', strength: '30mg/5ml', mfr: 'Boehringer Ingelheim', use: 'Breaks thick mucus in productive cough', minStock: 15, price: 38.0, mrp: 62.0, gst: 12.0 },
    { id: 'MED045', name: 'Dextromethorphan', generic: 'Dextromethorphan HBr', cat: 'Respiratory / Cough', form: 'Syrup', strength: '10mg/5ml', mfr: 'Dabur India', use: 'Dry irritating non-productive cough suppressant', minStock: 15, price: 45.0, mrp: 72.0, gst: 12.0 },
    { id: 'MED046', name: 'Mefenamic Acid', generic: 'Mefenamic Acid', cat: 'NSAID / Spasm', form: 'Tablet', strength: '500mg', mfr: 'Blue Cross (Meftal-Spas)', use: 'Menstrual cramps & abdominal colic pain', minStock: 20, price: 28.0, mrp: 48.0, gst: 12.0 },
    { id: 'MED047', name: 'Etoricoxib 90mg', generic: 'Etoricoxib', cat: 'NSAID / COX-2', form: 'Tablet', strength: '90mg', mfr: 'Sun Pharma (Nucoxia)', use: 'Gout & severe inflammatory arthritis', minStock: 15, price: 88.0, mrp: 148.0, gst: 12.0 },
    { id: 'MED048', name: 'Lactulose', generic: 'Lactulose Solution USP', cat: 'Gastrointestinal / Laxative', form: 'Syrup', strength: '10g/15ml', mfr: 'Abbott (Duphalac)', use: 'Osmotic laxative for constipation', minStock: 15, price: 110.0, mrp: 175.0, gst: 12.0 },
    { id: 'MED049', name: 'Probiotic Capsules', generic: 'Lactobacillus Spores', cat: 'Gastrointestinal', form: 'Capsule', strength: '5 Billion Spores', mfr: 'Dr. Reddy (Darolac)', use: 'Restores gut microflora during antibiotic therapy', minStock: 20, price: 75.0, mrp: 125.0, gst: 12.0 },
    { id: 'MED050', name: 'Antacid Tablets', generic: 'Magaldrate + Simethicone', cat: 'Antacids', form: 'Chewable Tablet', strength: '480mg+20mg', mfr: 'Pfizer (Gelusil)', use: 'Instant relief from stomach gas and acidity', minStock: 30, price: 15.0, mrp: 26.0, gst: 12.0 }
  ];

  // Insert 50 Medicines into PostgreSQL
  const createdMeds = {};
  for (const m of medicines50) {
    const rec = await prisma.medicine.create({
      data: {
        productId: m.id,
        name: m.name,
        genericName: m.generic,
        category: m.cat,
        dosageForm: m.form,
        strength: m.strength,
        manufacturer: m.mfr,
        gstRate: m.gst,
        unit: 'Strip',
        minStockLevel: m.minStock,
        dosageUsage: m.use
      }
    });
    createdMeds[m.id] = { ...m, dbId: rec.id };
  }
  console.log(`✓ Successfully seeded exactly ${medicines50.length} distinct medicine products.`);

  // 5. Seed Batches with precise stock distribution
  // - 3 multiple-batch showcase medicines (Paracetamol 500mg, Cetirizine 10mg, Metformin 500mg)
  // - 8 Low Stock medicines (remaining <= minStockLevel)
  // - 4 Out of Stock medicines (remaining = 0)
  // - 5 Near Expiry medicines (expiry within 60 days from Sep 2026 -> Oct/Nov 2026)
  // - Remaining ~30 Normal Stock medicines

  const now = new Date('2026-09-24T12:00:00Z');

  // Multi-Batch Showcase 1: Paracetamol 500mg (MED001)
  // Batch 1: FEFO Priority #1, 20 left, expires 10-Nov-2026 (Near Expiry < 60d -> RED)
  await prisma.medicineBatch.create({
    data: {
      batchNumber: 'BATCH001',
      medicineId: createdMeds['MED001'].dbId,
      dealerId: dealer1.id,
      pharmacyId: pharmacy.id,
      initialQuantity: 50,
      soldQuantity: 30,
      remainingQuantity: 20,
      purchasePrice: 15.0,
      sellingPrice: 25.0,
      mfgDate: new Date('2025-05-10'),
      expiryDate: new Date('2026-11-10'), // < 60 days
      receivedDate: new Date('2025-05-20')
    }
  });

  // Batch 2: Held in reserve, 100 left, expires 20-Feb-2027 (Safe -> GREEN)
  await prisma.medicineBatch.create({
    data: {
      batchNumber: 'BATCH002',
      medicineId: createdMeds['MED001'].dbId,
      dealerId: dealer1.id,
      pharmacyId: pharmacy.id,
      initialQuantity: 100,
      soldQuantity: 0,
      remainingQuantity: 100,
      purchasePrice: 16.0,
      sellingPrice: 26.0,
      mfgDate: new Date('2026-01-15'),
      expiryDate: new Date('2027-02-20'),
      receivedDate: new Date('2026-02-01')
    }
  });

  // Batch 3: Expired in Aug 2026 (Expired -> DARK RED)
  await prisma.medicineBatch.create({
    data: {
      batchNumber: 'BATCH003',
      medicineId: createdMeds['MED001'].dbId,
      dealerId: dealer1.id,
      pharmacyId: pharmacy.id,
      initialQuantity: 30,
      soldQuantity: 10,
      remainingQuantity: 20,
      purchasePrice: 14.0,
      sellingPrice: 24.0,
      mfgDate: new Date('2024-08-01'),
      expiryDate: new Date('2026-08-15'), // Expired in Aug 2026
      receivedDate: new Date('2024-08-20')
    }
  });

  // Multi-Batch Showcase 2: Cetirizine 10mg (MED004)
  // Batch 1: 30 units, expires 15-Dec-2026
  await prisma.medicineBatch.create({
    data: {
      batchNumber: 'CET-2024-01',
      medicineId: createdMeds['MED004'].dbId,
      dealerId: dealer2.id,
      pharmacyId: pharmacy.id,
      initialQuantity: 50,
      soldQuantity: 20,
      remainingQuantity: 30,
      purchasePrice: 12.0,
      sellingPrice: 21.0,
      mfgDate: new Date('2025-06-01'),
      expiryDate: new Date('2026-12-15'),
      receivedDate: new Date('2025-06-15')
    }
  });

  // Batch 2: 80 units, expires 25-Mar-2027
  await prisma.medicineBatch.create({
    data: {
      batchNumber: 'CET-2025-02',
      medicineId: createdMeds['MED004'].dbId,
      dealerId: dealer2.id,
      pharmacyId: pharmacy.id,
      initialQuantity: 80,
      soldQuantity: 0,
      remainingQuantity: 80,
      purchasePrice: 12.5,
      sellingPrice: 22.0,
      mfgDate: new Date('2026-02-10'),
      expiryDate: new Date('2027-03-25'),
      receivedDate: new Date('2026-02-25')
    }
  });

  // Multi-Batch Showcase 3: Metformin 500mg (MED010)
  // Batch 1: 45 units, expires 20-Nov-2026 (Near Expiry < 60d)
  await prisma.medicineBatch.create({
    data: {
      batchNumber: 'MET-24-A',
      medicineId: createdMeds['MED010'].dbId,
      dealerId: dealer1.id,
      pharmacyId: pharmacy.id,
      initialQuantity: 60,
      soldQuantity: 15,
      remainingQuantity: 45,
      purchasePrice: 18.0,
      sellingPrice: 30.0,
      mfgDate: new Date('2025-04-10'),
      expiryDate: new Date('2026-11-20'),
      receivedDate: new Date('2025-04-25')
    }
  });

  // Batch 2: 90 units, expires 15-Aug-2027
  await prisma.medicineBatch.create({
    data: {
      batchNumber: 'MET-25-B',
      medicineId: createdMeds['MED010'].dbId,
      dealerId: dealer1.id,
      pharmacyId: pharmacy.id,
      initialQuantity: 90,
      soldQuantity: 0,
      remainingQuantity: 90,
      purchasePrice: 18.5,
      sellingPrice: 31.0,
      mfgDate: new Date('2026-01-10'),
      expiryDate: new Date('2027-08-15'),
      receivedDate: new Date('2026-01-20')
    }
  });

  // 4 Out of Stock Medicines (Stock = 0, automatically generates Dealer Requirement)
  const outOfStockIds = ['MED007', 'MED027', 'MED041', 'MED047'];
  // Azithromycin 500mg, Cefixime 200mg, Levothyroxine 50mcg, Etoricoxib 90mg
  for (const pid of outOfStockIds) {
    const med = createdMeds[pid];
    await prisma.medicineBatch.create({
      data: {
        batchNumber: `OOS-${pid}-01`,
        medicineId: med.dbId,
        dealerId: dealer1.id,
        pharmacyId: pharmacy.id,
        initialQuantity: 40,
        soldQuantity: 40,
        remainingQuantity: 0, // 0 Out of stock
        purchasePrice: med.price,
        sellingPrice: med.mrp,
        mfgDate: new Date('2025-02-01'),
        expiryDate: new Date('2027-05-15'),
        receivedDate: new Date('2025-02-15')
      }
    });
  }

  // 8 Low Stock Medicines (Stock <= minStockLevel)
  const lowStockConfigs = [
    { pid: 'MED002', qty: 6, exp: '2027-04-10' }, // Paracetamol 650mg (min: 30) -> 6 left
    { pid: 'MED006', qty: 4, exp: '2027-06-15' }, // Amoxicillin 500mg (min: 20) -> 4 left
    { pid: 'MED008', qty: 5, exp: '2027-05-20' }, // Pantoprazole 40mg (min: 25) -> 5 left
    { pid: 'MED012', qty: 3, exp: '2027-07-01' }, // Amlodipine 5mg (min: 20) -> 3 left
    { pid: 'MED018', qty: 5, exp: '2027-09-10' }, // Montelukast + Levo (min: 25) -> 5 left
    { pid: 'MED020', qty: 4, exp: '2027-08-15' }, // Aceclofenac 100mg (min: 20) -> 4 left
    { pid: 'MED028', qty: 3, exp: '2027-10-01' }, // Ciprofloxacin 500mg (min: 15) -> 3 left
    { pid: 'MED043', qty: 2, exp: '2027-06-25' }, // Salbutamol (min: 10) -> 2 left
  ];

  for (const item of lowStockConfigs) {
    const med = createdMeds[item.pid];
    await prisma.medicineBatch.create({
      data: {
        batchNumber: `LOW-${item.pid}-88`,
        medicineId: med.dbId,
        dealerId: dealer2.id,
        pharmacyId: pharmacy.id,
        initialQuantity: 50,
        soldQuantity: 50 - item.qty,
        remainingQuantity: item.qty,
        purchasePrice: med.price,
        sellingPrice: med.mrp,
        mfgDate: new Date('2025-05-01'),
        expiryDate: new Date(item.exp),
        receivedDate: new Date('2025-05-15')
      }
    });
  }

  // 5 Near Expiry Medicines (Expiry within 60 days, e.g. Oct 2026 - Nov 2026)
  const nearExpiryConfigs = [
    { pid: 'MED003', qty: 24, exp: '2026-10-28' }, // Ibuprofen 400mg -> 34 days left
    { pid: 'MED005', qty: 18, exp: '2026-11-05' }, // Levocetirizine 5mg -> 42 days left
    { pid: 'MED014', qty: 15, exp: '2026-10-18' }, // Losartan 50mg -> 24 days left
    { pid: 'MED022', qty: 20, exp: '2026-11-15' }, // Ondansetron 4mg -> 52 days left
    { pid: 'MED026', qty: 16, exp: '2026-11-08' }, // Doxycycline 100mg -> 45 days left
  ];

  for (const item of nearExpiryConfigs) {
    const med = createdMeds[item.pid];
    await prisma.medicineBatch.create({
      data: {
        batchNumber: `EXP-${item.pid}-RED`,
        medicineId: med.dbId,
        dealerId: dealer1.id,
        pharmacyId: pharmacy.id,
        initialQuantity: 40,
        soldQuantity: 40 - item.qty,
        remainingQuantity: item.qty,
        purchasePrice: med.price,
        sellingPrice: med.mrp,
        mfgDate: new Date('2025-03-01'),
        expiryDate: new Date(item.exp),
        receivedDate: new Date('2025-03-10')
      }
    });
  }

  // Remaining Medicines: Normal Healthy Stock (> 2 months away, healthy quantity)
  const handledPids = new Set([
    'MED001', 'MED004', 'MED010', // multi batch
    ...outOfStockIds, // 4 out of stock
    ...lowStockConfigs.map(c => c.pid), // 8 low stock
    ...nearExpiryConfigs.map(c => c.pid) // 5 near expiry
  ]);

  let normalCount = 0;
  for (const m of medicines50) {
    if (!handledPids.has(m.id)) {
      normalCount++;
      const assignedDealer = normalCount % 2 === 0 ? dealer1.id : dealer2.id;
      const stock = 40 + (normalCount * 3);
      await prisma.medicineBatch.create({
        data: {
          batchNumber: `NORM-${m.id}-26`,
          medicineId: createdMeds[m.id].dbId,
          dealerId: assignedDealer,
          pharmacyId: pharmacy.id,
          initialQuantity: stock + 20,
          soldQuantity: 20,
          remainingQuantity: stock,
          purchasePrice: m.price,
          sellingPrice: m.mrp,
          mfgDate: new Date('2025-08-01'),
          expiryDate: new Date(`2027-0${(normalCount % 8) + 2}-20`), // Safe expiry in 2027
          receivedDate: new Date('2025-08-15')
        }
      });
    }
  }

  console.log(`✓ Seeded Batches across all 50 medicines: Normal, Low-Stock (8), Out-of-Stock (4), Near-Expiry (5), Multi-Batch (3).`);

  // 6. Seed Customers (With unique phone numbers for instant lookup workflow)
  const customersData = [
    {
      code: 'CUST-2026-0001',
      name: 'Rahul Kumar',
      phone: '9876543210',
      email: 'rahul@email.com',
      address: 'No 45, Gandhi Nagar, Chennai',
      age: 34,
      gender: 'Male',
      type: 'EXISTING',
      visits: 5,
      spent: 4250.0
    },
    {
      code: 'CUST-2026-0002',
      name: 'Priya Sharma',
      phone: '9845012345',
      email: 'priya.sharma@example.com',
      address: '12th Cross, Indiranagar, Bengaluru',
      age: 29,
      gender: 'Female',
      type: 'EXISTING',
      visits: 3,
      spent: 2840.0
    },
    {
      code: 'CUST-2026-0003',
      name: 'Amit Patel',
      phone: '9988776655',
      email: 'amit.patel@example.com',
      address: '5th Block, Koramangala, Bengaluru',
      age: 45,
      gender: 'Male',
      type: 'EXISTING',
      visits: 2,
      spent: 1750.0
    },
    {
      code: 'CUST-2026-0004',
      name: 'Sneha Rao',
      phone: '9741234567',
      email: 'sneha.rao@example.com',
      address: '4th T Block, Jayanagar, Bengaluru',
      age: 38,
      gender: 'Female',
      type: 'EXISTING',
      visits: 4,
      spent: 3620.0
    },
    {
      code: 'CUST-2026-0005',
      name: 'Vikram Singh',
      phone: '9123456789',
      email: 'vikram.singh@example.com',
      address: 'Prestige Boulevard, Whitefield, Bengaluru',
      age: 52,
      gender: 'Male',
      type: 'EXISTING',
      visits: 1,
      spent: 850.0
    }
  ];

  const createdCustomers = {};
  for (const c of customersData) {
    const cust = await prisma.customer.create({
      data: {
        customerCode: c.code,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        age: c.age,
        gender: c.gender,
        customerType: c.type,
        totalVisits: c.visits,
        totalSpent: c.spent
      }
    });
    createdCustomers[c.phone] = cust;
  }
  console.log(`✓ Seeded ${customersData.length} Registered Customers for Phone Search.`);

  // 7. Seed Sample Bills & Sales History
  const bill1 = await prisma.bill.create({
    data: {
      billNumber: 'INV-2026-0001',
      pharmacyId: pharmacy.id,
      staffId: staffUser.id,
      customerId: createdCustomers['9876543210'].id,
      customerName: 'Rahul Kumar',
      customerPhone: '9876543210',
      customerAddress: 'No 45, Gandhi Nagar, Chennai',
      customerType: 'EXISTING',
      paymentMethod: 'UPI',
      subtotal: 50.0,
      discount: 5.0,
      taxAmount: 6.0,
      grandTotal: 51.0,
      createdAt: new Date('2026-09-24T10:30:00Z')
    }
  });

  const p1Batch = await prisma.medicineBatch.findFirst({
    where: { medicineId: createdMeds['MED001'].dbId, batchNumber: 'BATCH001' }
  });

  if (p1Batch) {
    await prisma.billItem.create({
      data: {
        billId: bill1.id,
        medicineId: createdMeds['MED001'].dbId,
        batchId: p1Batch.id,
        quantity: 2,
        unitPrice: 25.0,
        gstRate: 12.0,
        doctorName: 'Dr. Self / Consulting Physician',
        customerType: 'EXISTING',
        usageInstructions: 'Take 1 tablet after meals as needed for fever',
        total: 56.0
      }
    });
  }

  const bill2 = await prisma.bill.create({
    data: {
      billNumber: 'INV-2026-0002',
      pharmacyId: pharmacy.id,
      staffId: staffUser.id,
      customerId: createdCustomers['9845012345'].id,
      customerName: 'Priya Sharma',
      customerPhone: '9845012345',
      customerAddress: '12th Cross, Indiranagar, Bengaluru',
      customerType: 'EXISTING',
      paymentMethod: 'CASH',
      subtotal: 125.0,
      discount: 0.0,
      taxAmount: 15.0,
      grandTotal: 140.0,
      createdAt: new Date('2026-09-24T14:15:00Z')
    }
  });

  const doloBatch = await prisma.medicineBatch.findFirst({
    where: { medicineId: createdMeds['MED002'].dbId }
  });

  if (doloBatch) {
    await prisma.billItem.create({
      data: {
        billId: bill2.id,
        medicineId: createdMeds['MED002'].dbId,
        batchId: doloBatch.id,
        quantity: 3,
        unitPrice: 33.5,
        gstRate: 12.0,
        doctorName: 'Dr. Self / Consulting Physician',
        customerType: 'EXISTING',
        usageInstructions: 'For high body temperature. 1 tablet after food.',
        total: 112.56
      }
    });
  }

  console.log('✓ Seeded Sample Bills and Invoice Items.');

  // 8. Seed Purchase Orders with Dealer Connection
  const po1 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2026-0001',
      dealerId: dealer1.id,
      pharmacyId: pharmacy.id,
      status: 'APPROVED',
      totalAmount: 12500.0,
      orderDate: new Date('2026-09-20'),
      notes: 'Urgent restocking for seasonal anti-allergics and antibiotics'
    }
  });

  await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po1.id,
      medicineId: createdMeds['MED007'].dbId, // Azithromycin (out of stock)
      batchNumber: 'AZI-PO-26',
      quantity: 50,
      purchasePrice: 72.0,
      sellingPrice: 119.0,
      mfgDate: new Date('2026-08-01'),
      expiryDate: new Date('2028-02-15')
    }
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2026-0002',
      dealerId: dealer2.id,
      pharmacyId: pharmacy.id,
      status: 'PENDING',
      totalAmount: 3700.0,
      orderDate: new Date('2026-09-23'),
      notes: 'Automated low stock requirement for Pantoprazole & Amlodipine'
    }
  });

  await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po2.id,
      medicineId: createdMeds['MED008'].dbId, // Pantoprazole 40mg
      batchNumber: 'PAN-PO-26',
      quantity: 60,
      purchasePrice: 50.0,
      sellingPrice: 82.5,
      mfgDate: new Date('2026-08-10'),
      expiryDate: new Date('2028-04-15')
    }
  });

  await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po2.id,
      medicineId: createdMeds['MED012'].dbId, // Amlodipine 5mg
      batchNumber: 'AML-PO-26',
      quantity: 50,
      purchasePrice: 14.0,
      sellingPrice: 24.5,
      mfgDate: new Date('2026-08-15'),
      expiryDate: new Date('2028-06-20')
    }
  });

  console.log('✓ Seeded Purchase Orders and Dealer links.');

  console.log('====================================================');
  console.log(' PharmaFlow Database Seeding Completed Successfully! ');
  console.log(' Portals Ready:');
  console.log(' Owner:  owner@apollocare.com  / admin123');
  console.log(' Staff:  staff@apollocare.com  / staff123');
  console.log(' Dealer: dealer1@medisupply.com / dealer123');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
