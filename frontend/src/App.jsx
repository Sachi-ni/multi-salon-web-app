import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import { AuthProvider } from "./context/AuthContext";

// General Pages
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/register.jsx";
import Edit from "./pages/auth/edit.jsx";
//import Main from "./pages/dashboard.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";

//customer pages
import Landing from "./pages/customer/Landing.jsx";

// Super Admin Pages
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Profile from "./pages/superadmin/profile.jsx";
import SuperAdminDashboard from "./pages/superadmin/Dashboard.jsx";
import Revenue from "./pages/superadmin/Revenue.jsx";
import AddSalon from "./pages/superadmin/AddSalon.jsx";
import AddStaff from "./pages/superadmin/AddStaff.jsx";
import AddService from "./pages/superadmin/Services.jsx";
import Staff from "./pages/superadmin/Staff.jsx";
import Appointments from "./pages/superadmin/Appointments.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import Salons from "./pages/superadmin/Salons.jsx";
import AddAppointment from "./pages/superadmin/AddAppointment.jsx";
import Services from "./pages/superadmin/Services.jsx";

import CustomerLayout   from "./components/layout/CustomerLayout.jsx";
import CustomerDashboard from "./pages/customer/Dashboard.jsx";
import Branches         from "./pages/customer/Branches.jsx";
import CustomerServices from "./pages/customer/Services.jsx";
import CustomerStaff    from "./pages/customer/Staff.jsx";
import BookAppointment  from "./pages/customer/BookAppointment.jsx";
import MyAppointments   from "./pages/customer/MyAppointments.jsx";

// Admin pages
import AdminBookings from "./pages/admin/AdminBookings.jsx";
import AdminDailySchedule from "./pages/admin/AdminDailySchedule.jsx";
import AdminStaffSchedule from "./pages/admin/AdminStaffSchedule.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SalonAdminShell from "./pages/admin/SalonAdminShell";
import AdminSalonLayout from "./components/layout/AdminSalonLayout";
import AdminAddStaff from "./pages/admin/AddStaff.jsx";

import { useAuth } from "./context/AuthContext";
import CustomerRegister from "./pages/auth/CustomerRegister.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />; // you can make a simple Unauthorized page
  }

  return children;
};


function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      {/* All Routes MUST be inside this container */}
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/editProfile" element={<Edit />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/customer/register" element={<CustomerRegister />} />

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
            <ProtectedRoute allowedRoles={["super-admin", "manager"]}>
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
          path="/Revenue"
          element={
            <ProtectedRoute allowedRoles={["super-admin"]}>
              <DashboardLayout>
                <Revenue />
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

        // This route is for adding service to a specific salon, so it includes a salonId param

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

        <Route path="/customer/branches" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><Branches /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/customer/services" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><CustomerServices /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/customer/staff" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><CustomerStaff /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/book" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><BookAppointment /></CustomerLayout>
          </ProtectedRoute>
        } />

        <Route path="/my-appointments" element={
          <ProtectedRoute allowedRoles={["customer", "user"]}>
            <CustomerLayout><MyAppointments /></CustomerLayout>
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
            <ProtectedRoute allowedRoles={["super-admin", "manager"]}>
              <AdminSalonLayout>
                <AdminAddStaff />
              </AdminSalonLayout>
            </ProtectedRoute>
          }
        />
        
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;