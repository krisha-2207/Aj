const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/auth.routes');
const medicineRoutes = require('./routes/medicine.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const billRoutes = require('./routes/bill.routes');
const dealerRoutes = require('./routes/dealer.routes');
const purchaseOrderRoutes = require('./routes/purchaseOrder.routes');
const accountRoutes = require('./routes/account.routes');
const staffRoutes = require('./routes/staff.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const supabaseRoutes = require('./routes/supabase.routes');
const aiRoutes = require('./routes/ai.routes');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/supabase', supabaseRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'Pharmacy Management & Medical Supply Management System',
    timestamp: new Date().toISOString(),
    currency: 'INR (₹)',
    supabase: {
      connected: true,
      projectUrl: process.env.SUPABASE_URL || 'https://xbzbgwfhuzrmnoighnaq.supabase.co'
    }
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Pharmacy Management Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Database: Supabase Cloud (${process.env.SUPABASE_URL || 'Connected'})`);
  console.log(`=======================================================`);
});
