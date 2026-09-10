import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import ChatWidget from "./components/chatbot/ChatWidget";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

// General Pages
import Login from "./pages/auth/Login.jsx";
import Edit from "./pages/auth/edit.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";

//customer pages
import Landing from "./pages/customer/Landing.jsx";
import TeamPage from "./pages/customer/TeamPage.jsx";
import SalonsPage from "./pages/customer/SalonsPage.jsx";
import SalonDetailsPage from "./pages/customer/SalonDetailsPage.jsx";
import AboutUs from "./pages/customer/AboutUs.jsx";
import ContactPage from "./pages/customer/ContactPage.jsx";
import TestimonialsPage from "./pages/customer/TestimonialsPage.jsx";
import PrivacyPolicy from "./pages/customer/PrivacyPolicy.jsx";
import TermsOfService from "./pages/customer/TermsOfService.jsx";

// Super Admin Pages
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Profile from "./pages/superadmin/profile.jsx";
import SuperAdminDashboard from "./pages/superadmin/Dashboard.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import AddSalon from "./pages/superadmin/AddSalon.jsx";
import AddStaff from "./pages/superadmin/AddStaff.jsx";
import AddService from "./pages/superadmin/Services.jsx";
import Staff from "./pages/superadmin/Staff.jsx";
import Appointments from "./pages/superadmin/Appointments.jsx";
import Salons from "./pages/superadmin/Salons.jsx";
import AddAppointment from "./pages/superadmin/AddAppointment.jsx";
import Services from "./pages/superadmin/Services.jsx";
import SuperAdminReviews from "./pages/superadmin/SuperAdminReviews.jsx";
import SuperAdminSalary from "./pages/superadmin/Salary.jsx";

import CustomerLayout   from "./components/layout/CustomerLayout.jsx";
import CustomerDashboard from "./pages/customer/Dashboard.jsx";
import Branches         from "./pages/customer/Branches.jsx";
import CustomerServices from "./pages/customer/Services.jsx";
import CustomerStaff    from "./pages/customer/Staff.jsx";
import BookAppointment  from "./pages/customer/BookAppointment.jsx";
import MyAppointments   from "./pages/customer/MyAppointments.jsx";
import GiveFeedback    from "./pages/customer/GiveFeedback.jsx";

// Staff pages
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";

// Admin pages
import AdminBookings from "./pages/admin/AdminBookings.jsx";

import Billing from "./pages/admin/Billing.jsx";
import SalonAdminShell from "./pages/admin/SalonAdminShell";
import AdminSalonLayout from "./components/layout/AdminSalonLayout";
import AdminAddStaff from "./pages/admin/AddStaff.jsx";

import { useAuth } from "./context/AuthContext";
import CustomerRegister from "./pages/auth/CustomerRegister.jsx";
import SuperAdminHardening from "./pages/auth/SuperAdminHardening.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

const ProtectedRoute = ({ children, allowedRoles, requireSalonAccess }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requireSalonAccess && user.role !== "super-admin" && !user.salon_id) {
    return <Navigate to="/unauthorized" />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />; 
  }

  return children;
};


function App() {
  return (
    <AuthProvider>
    <ToastProvider>
    <BrowserRouter>
      {/* All Routes MUST be inside this container */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/our-salons" element={<SalonsPage />} />
        <Route path="/our-salons/:id" element={<SalonDetailsPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/editProfile" element={<Edit />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/super-admin-hardening" element={<SuperAdminHardening />} />

       <Route
          path="/superAdminDashboard"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <SuperAdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Salon Admin Shell (full salon website for selected salon) */}
        <Route
          path="/salon-admin/:salonId/*"
          element={
            <ProtectedRoute requireSalonAccess={true}>
              <AdminSalonLayout>
                <SalonAdminShell />
              </AdminSalonLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Profile"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Analytics"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superAdminBilling"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Billing />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Manager Salary & Payroll (super admin only, across all salons) */}
        <Route
          path="/Salary"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <SuperAdminSalary />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Staff"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Staff />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Services"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Services />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/AddSalon"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <AddSalon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/AddStaff"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <AddStaff />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* This route is for adding service to a specific salon, so it includes a salonId param */}

        <Route
          path="/AddStaff/:salonId"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <AddStaff />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/AddService/:salonId"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <AddService />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Appointments"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Appointments />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superAdminReviews"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <SuperAdminReviews />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/salons"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Salons />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/AddAppointment"
          element={
            <DashboardLayout>
              <AddAppointment />
            </DashboardLayout>
          }
        />

        <Route path="/customer/dashboard" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><CustomerDashboard /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/customer/profile" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <Edit />
          </ProtectedRoute>
        } />

        <Route path="/customer/branches" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><Branches /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/our-services" element={
          <CustomerServices />
        } />

        <Route path="/customer/staff" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><CustomerStaff /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/book" element={
          <CustomerLayout><BookAppointment /></CustomerLayout>
        } />

        <Route path="/my-appointments" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><MyAppointments /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/customer/give-feedback/:appointmentId" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><GiveFeedback /></CustomerLayout>
          </ProtectedRoute>
        } />

        {/* Staff Dashboard */}
        <Route path="/staff/dashboard" element={
          <ProtectedRoute requireSalonAccess={true}>
            <AdminSalonLayout>
              <StaffDashboard />
            </AdminSalonLayout>
          </ProtectedRoute>
        } />

        {/* Admin Bookings */}
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={["super-admin", "manager"]}>
              <DashboardLayout>
                <AdminBookings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/salon-admin/:salonId/AddStaff"
          element={
            <ProtectedRoute requireSalonAccess={true}>
              <AdminSalonLayout>
                <AdminAddStaff />
              </AdminSalonLayout>
            </ProtectedRoute>
          }
        />
        
      </Routes>
      <ChatWidget />
    </BrowserRouter>
    </ToastProvider>
    </AuthProvider>
  );
}

export default App;