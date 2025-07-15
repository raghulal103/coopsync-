import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ThemeProvider } from './context/ThemeContext';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';

// Layout Components
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';

// User Management Pages
import UsersPage from './pages/users/UsersPage';
import UserDetailsPage from './pages/users/UserDetailsPage';
import RolesPage from './pages/users/RolesPage';

// Project Management Pages
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage';
import TasksPage from './pages/projects/TasksPage';

// Labour Management Pages
import LabourPage from './pages/labour/LabourPage';
import AttendancePage from './pages/labour/AttendancePage';
import LabourReportsPage from './pages/labour/LabourReportsPage';

// Payroll Pages
import PayrollPage from './pages/payroll/PayrollPage';
import PayrollProcessPage from './pages/payroll/PayrollProcessPage';
import PayrollReportsPage from './pages/payroll/PayrollReportsPage';

// Accounting Pages
import AccountsPage from './pages/accounting/AccountsPage';
import TransactionsPage from './pages/accounting/TransactionsPage';
import JournalEntriesPage from './pages/accounting/JournalEntriesPage';
import FinancialReportsPage from './pages/accounting/FinancialReportsPage';

// GST Pages
import GSTPage from './pages/gst/GSTPage';
import GSTReturnsPage from './pages/gst/GSTReturnsPage';
import GSTReportsPage from './pages/gst/GSTReportsPage';

// Asset Management Pages
import AssetsPage from './pages/assets/AssetsPage';
import AssetDetailsPage from './pages/assets/AssetDetailsPage';
import AssetReportsPage from './pages/assets/AssetReportsPage';

// Scrap Management Pages
import ScrapPage from './pages/scrap/ScrapPage';
import ScrapDisposalPage from './pages/scrap/ScrapDisposalPage';

// Dividend Pages
import DividendsPage from './pages/dividends/DividendsPage';
import ShareholdersPage from './pages/dividends/ShareholdersPage';
import DividendPaymentsPage from './pages/dividends/DividendPaymentsPage';

// Audit Pages
import AuditPage from './pages/audit/AuditPage';
import AuditReportsPage from './pages/audit/AuditReportsPage';
import CompliancePage from './pages/audit/CompliancePage';

// Subscription Pages
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import BillingPage from './pages/subscription/BillingPage';

// Error Pages
import NotFoundPage from './pages/errors/NotFoundPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';

// Styles
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TenantProvider>
              <Router>
                <div className="App">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/auth/*" element={
                      <GuestRoute>
                        <AuthLayout>
                          <Routes>
                            <Route index element={<Navigate to="/auth/login" replace />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="register" element={<RegisterPage />} />
                            <Route path="forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="reset-password" element={<ResetPasswordPage />} />
                            <Route path="verify-email" element={<VerifyEmailPage />} />
                          </Routes>
                        </AuthLayout>
                      </GuestRoute>
                    } />

                    {/* Protected Routes */}
                    <Route path="/dashboard/*" element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <Routes>
                            <Route index element={<DashboardPage />} />
                            
                            {/* Profile & Settings */}
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            
                            {/* User Management */}
                            <Route path="users" element={<UsersPage />} />
                            <Route path="users/:id" element={<UserDetailsPage />} />
                            <Route path="roles" element={<RolesPage />} />
                            
                            {/* Project Management */}
                            <Route path="projects" element={<ProjectsPage />} />
                            <Route path="projects/:id" element={<ProjectDetailsPage />} />
                            <Route path="tasks" element={<TasksPage />} />
                            
                            {/* Labour Management */}
                            <Route path="labour" element={<LabourPage />} />
                            <Route path="attendance" element={<AttendancePage />} />
                            <Route path="labour-reports" element={<LabourReportsPage />} />
                            
                            {/* Payroll */}
                            <Route path="payroll" element={<PayrollPage />} />
                            <Route path="payroll-process" element={<PayrollProcessPage />} />
                            <Route path="payroll-reports" element={<PayrollReportsPage />} />
                            
                            {/* Accounting */}
                            <Route path="accounts" element={<AccountsPage />} />
                            <Route path="transactions" element={<TransactionsPage />} />
                            <Route path="journal-entries" element={<JournalEntriesPage />} />
                            <Route path="financial-reports" element={<FinancialReportsPage />} />
                            
                            {/* GST */}
                            <Route path="gst" element={<GSTPage />} />
                            <Route path="gst-returns" element={<GSTReturnsPage />} />
                            <Route path="gst-reports" element={<GSTReportsPage />} />
                            
                            {/* Asset Management */}
                            <Route path="assets" element={<AssetsPage />} />
                            <Route path="assets/:id" element={<AssetDetailsPage />} />
                            <Route path="asset-reports" element={<AssetReportsPage />} />
                            
                            {/* Scrap Management */}
                            <Route path="scrap" element={<ScrapPage />} />
                            <Route path="scrap-disposal" element={<ScrapDisposalPage />} />
                            
                            {/* Dividend Management */}
                            <Route path="dividends" element={<DividendsPage />} />
                            <Route path="shareholders" element={<ShareholdersPage />} />
                            <Route path="dividend-payments" element={<DividendPaymentsPage />} />
                            
                            {/* Audit & Compliance */}
                            <Route path="audit" element={<AuditPage />} />
                            <Route path="audit-reports" element={<AuditReportsPage />} />
                            <Route path="compliance" element={<CompliancePage />} />
                            
                            {/* Subscription */}
                            <Route path="subscription" element={<SubscriptionPage />} />
                            <Route path="billing" element={<BillingPage />} />
                            
                            {/* Error Pages */}
                            <Route path="unauthorized" element={<UnauthorizedPage />} />
                            <Route path="server-error" element={<ServerErrorPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                          </Routes>
                        </DashboardLayout>
                      </ProtectedRoute>
                    } />

                    {/* Root redirects */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                  
                  {/* Global Toast Notifications */}
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                        theme: {
                          primary: '#4ade80',
                          secondary: '#000',
                        },
                      },
                      error: {
                        duration: 5000,
                        theme: {
                          primary: '#ef4444',
                          secondary: '#000',
                        },
                      },
                    }}
                  />
                </div>
              </Router>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
        
        {/* React Query Devtools */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;