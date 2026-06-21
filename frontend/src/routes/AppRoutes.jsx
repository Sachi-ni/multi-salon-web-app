import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";

import BookAppointment from "../pages/customer/BookAppointment";
import MyAppointments from "../pages/customer/MyAppointments";
import TeamPage from "../pages/customer/TeamPage";

import AdminBookings from "../pages/admin/AdminBookings";
import Dashboard from "../pages/superadmin/Dashboard";
import Login from "../pages/Login";

import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Super Admin */}
        <Route
          path="/superAdminDashboard"
          element={
            <RoleBasedRoute roles={["super-admin"]}>
              <Dashboard />
            </RoleBasedRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/team" element={<TeamPage />} />

        {/* Customer — any logged in user can book */}
        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-appointments"
          element={
            <ProtectedRoute>
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        {/* Admin — only super-admin and staff-admin can view bookings */}
        <Route
          path="/admin/bookings"
          element={
            <RoleBasedRoute roles={["super-admin", "staff-admin"]}>
              <AdminBookings />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <RoleBasedRoute roles={["super-admin"]}>
              <Dashboard />
            </RoleBasedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}