import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import BookAppointment from "../pages/customer/BookAppointment";
import AdminBookings from "../pages/admin/AdminBookings";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import MyAppointments   from "../pages/customer/MyAppointments";


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
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

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}