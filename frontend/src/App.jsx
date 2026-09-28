import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AiCopilotDrawer from './components/AiCopilotDrawer';

// Landing Page
import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/Login';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import InventoryPage from './pages/owner/InventoryPage';
import MedicinesPage from './pages/owner/MedicinesPage';
import BatchesPage from './pages/owner/BatchesPage';
import BillingPage from './pages/owner/BillingPage';
import DealersPage from './pages/owner/DealersPage';
import PurchaseOrdersPage from './pages/owner/PurchaseOrdersPage';
import StaffPage from './pages/owner/StaffPage';
import AccountsPage from './pages/owner/AccountsPage';
import ReportsPage from './pages/owner/ReportsPage';
import AIInsightsPage from './pages/owner/AIInsightsPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffBillingPage from './pages/staff/StaffBillingPage';
import StaffMySalesPage from './pages/staff/StaffMySalesPage';
import StaffProfilePage from './pages/staff/StaffProfilePage';

// Dealer Pages
import DealerDashboard from './pages/dealer/DealerDashboard';
import DealerBillsPage from './pages/dealer/DealerBillsPage';
import DealerSuppliedMedicinesPage from './pages/dealer/DealerSuppliedMedicinesPage';
import DealerBatchesPage from './pages/dealer/DealerBatchesPage';
import DealerOrdersPage from './pages/dealer/DealerOrdersPage';
import DealerProfilePage from './pages/dealer/DealerProfilePage';

// Common Layout wrapper with Sidebar & Top Navbar
function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
      <AiCopilotDrawer />
    </div>
  );
}

// Root Redirection Component
function RootRedirect() {
  const { user, loading, getRoleDashboard } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getRoleDashboard(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* OWNER PORTAL ROUTES (Strictly restricted to OWNER) */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="dealers" element={<DealersPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ai-insights" element={<AIInsightsPage />} />
        <Route path="ai" element={<Navigate to="/owner/ai-insights" replace />} />
        <Route index element={<Navigate to="/owner/dashboard" replace />} />
      </Route>

      {/* STAFF PORTAL ROUTES (Restricted to STAFF) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['STAFF', 'OWNER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="billing" element={<StaffBillingPage />} />
        <Route path="sales" element={<StaffMySalesPage />} />
        <Route path="bills" element={<Navigate to="/staff/sales" replace />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="profile" element={<StaffProfilePage />} />
        <Route index element={<Navigate to="/staff/dashboard" replace />} />
      </Route>

      {/* DEALER / SUPPLIER PORTAL ROUTES (Restricted to DEALER) */}
      <Route
        path="/dealer"
        element={
          <ProtectedRoute allowedRoles={['DEALER', 'OWNER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DealerDashboard />} />
        <Route path="bills" element={<DealerBillsPage />} />
        <Route path="delivery-bills" element={<Navigate to="/dealer/bills" replace />} />
        <Route path="requirements" element={<Navigate to="/dealer/dashboard" replace />} />
        <Route path="medicines" element={<DealerSuppliedMedicinesPage />} />
        <Route path="batches" element={<DealerBatchesPage />} />
        <Route path="orders" element={<DealerOrdersPage />} />
        <Route path="history" element={<DealerBatchesPage />} />
        <Route path="profile" element={<DealerProfilePage />} />
        <Route index element={<Navigate to="/dealer/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
