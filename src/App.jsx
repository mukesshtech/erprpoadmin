import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ListPage from './components/ListPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import AttendancePage from './pages/employees/AttendancePage';
import LeavePage from './pages/employees/LeavePage';
import PayrollPage from './pages/employees/PayrollPage';
import ReimbursementPage from './pages/employees/ReimbursementPage';
import RecruitmentPage from './pages/employees/RecruitmentPage';
import AssetPage from './pages/employees/AssetPage';
import LeadPipelinePage from './pages/crm/LeadPipelinePage';
import SettingsPage from './pages/admin/SettingsPage';
import SalesDashboardPage from './pages/sales/SalesDashboardPage';
import SalesOrderDetailPage from './pages/sales/SalesOrderDetailPage';
import InvoicePage from './pages/sales/InvoicePage';
import ProductPage from './pages/sales/ProductPage';
import PurchaseDashboardPage from './pages/purchase/PurchaseDashboardPage';
import PurchaseOrderDetailPage from './pages/purchase/PurchaseOrderDetailPage';
import VendorPage from './pages/purchase/VendorPage';
import VendorBillPage from './pages/purchase/VendorBillPage';
import EmployeeDashboardPage from './pages/dashboard/EmployeeDashboardPage';
import DealsDashboardPage from './pages/dashboard/DealsDashboardPage';
import LeadsDashboardPage from './pages/dashboard/LeadsDashboardPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
        <div className="muted" style={{ fontSize: 13 }}>Loading...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="employee-dashboard" element={<EmployeeDashboardPage />} />
        <Route path="deals-dashboard" element={<DealsDashboardPage />} />
        <Route path="leads-dashboard" element={<LeadsDashboardPage />} />

        {/* CRM */}
        <Route path="crm/leads" element={<LeadPipelinePage />} />
        <Route path="crm/customers" element={<ListPage title="Customers" endpoint="/customers" />} />
        <Route path="crm/deals" element={<ListPage title="Deals" endpoint="/deals" />} />
        <Route path="crm/quotations" element={<ListPage title="Quotations" endpoint="/quotations" />} />
        <Route path="crm/enquiries" element={<ListPage title="Enquiries" endpoint="/enquiries" />} />

        {/* Sales */}
        <Route path="sales" element={<SalesDashboardPage />} />
        <Route path="sales/dashboard" element={<SalesDashboardPage />} />
        <Route path="sales/products" element={<ProductPage />} />
        <Route path="sales/orders" element={<ListPage title="Sales Orders" endpoint="/sales-orders" />} />
        <Route path="sales/orders/:id" element={<SalesOrderDetailPage />} />
        <Route path="sales/invoices" element={<InvoicePage />} />
        <Route path="sales/payments" element={<ListPage title="Payments In" endpoint="/payments-in" />} />

        {/* Purchase */}
        <Route path="purchase" element={<PurchaseDashboardPage />} />
        <Route path="purchase/dashboard" element={<PurchaseDashboardPage />} />
        <Route path="purchase/vendors" element={<VendorPage />} />
        <Route path="purchase/requests" element={<ListPage title="Purchase Requests" endpoint="/purchase-requests" />} />
        <Route path="purchase/orders" element={<ListPage title="Purchase Orders" endpoint="/purchase-orders" />} />
        <Route path="purchase/orders/:id" element={<PurchaseOrderDetailPage />} />
        <Route path="purchase/bills" element={<VendorBillPage />} />

        {/* HRMS */}
        <Route path="hrms/employees" element={<ListPage title="Employees" endpoint="/employees" />} />
        <Route path="hrms/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="hrms/attendance" element={<AttendancePage />} />
        <Route path="hrms/leaves" element={<LeavePage />} />
        <Route path="hrms/payroll" element={<PayrollPage />} />
        <Route path="hrms/reimbursements" element={<ReimbursementPage />} />
        <Route path="hrms/recruitment" element={<RecruitmentPage />} />
        <Route path="hrms/assets" element={<AssetPage />} />

        {/* Admin */}
        <Route path="admin/users" element={<ListPage title="Users" endpoint="/users" />} />
        <Route path="admin/roles" element={<ListPage title="Roles" endpoint="/roles" />} />
        <Route path="admin/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
