import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import BookAppointment from "../pages/customer/BookAppointment";
import AdminBookings from "../pages/admin/AdminBookings";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import MyAppointments   from "../pages/customer/MyAppointments";
import Dashboard from "../pages/superadmin/Dashboard";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Super Admin */}
        <Route path="/superAdminDashboard" element={
          <RoleBasedRoute roles={["super-admin"]}>
            <Dashboard />
          </RoleBasedRoute>
        } />

        
        {/* Customer — any logged in user can book */}
        <Route path="/book" element={
          <ProtectedRoute>
            <BookAppointment />
          </ProtectedRoute>
        } />

        <Route path="/my-appointments" element={
        <ProtectedRoute><MyAppointments /></ProtectedRoute>
        } />

        {/* Admin — only super-admin and staff-admin can view bookings */}
        <Route path="/admin/bookings" element={
            <RoleBasedRoute roles={["super-admin", "staff-admin"]}>
                <AdminBookings />
            </RoleBasedRoute>
        } />

        <Route path="/admin/dashboard" element={
          <RoleBasedRoute roles={["super-admin"]}>
            <Dashboard />
          </RoleBasedRoute>
        } />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}