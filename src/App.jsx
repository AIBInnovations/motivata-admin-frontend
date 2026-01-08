import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Enrollments from './pages/Enrollments';
import Coupons from './pages/Coupons';
import Users from './pages/Users';
import Admins from './pages/Admins';
import Payments from './pages/Payments';
import CashTickets from './pages/CashTickets';
import Vouchers from './pages/Vouchers';
import Sessions from './pages/Sessions';
import Quizes from './pages/Quizes';
import Challenges from './pages/Challenges';
import Polls from './pages/Polls';
import Stories from './pages/Stories';
import ScanQR from './pages/ScanQR';
import TicketReshare from './pages/TicketReshare';
import Memberships from './pages/Memberships';
import Clubs from './pages/Clubs';
import Settings from './pages/Settings';
import Services from './pages/Services';
import ServiceOrders from './pages/ServiceOrders';
import ServiceRequests from './pages/ServiceRequests';
import UserSubscriptions from './pages/UserSubscriptions';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/enrollments" element={<Enrollments />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/users" element={<Users />} />
            <Route path="/admins" element={<Admins />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/cash-tickets" element={<CashTickets />} />
            <Route path="/vouchers" element={<Vouchers />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/quizes" element={<Quizes />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/polls" element={<Polls />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/scan-qr" element={<ScanQR />} />
            <Route path="/ticket-reshare" element={<TicketReshare />} />
            <Route path="/services" element={<Services />} />
            <Route path="/service-orders" element={<ServiceOrders />} />
            <Route path="/service-requests" element={<ServiceRequests />} />
            <Route path="/user-subscriptions" element={<UserSubscriptions />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
