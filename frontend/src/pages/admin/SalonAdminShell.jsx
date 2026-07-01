import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "./AdminDashboard";
import AdminBookings from "./AdminBookings";
import Services from "./Services";
import Staff from "./Staff";
import AdminSalary from "./AdminSalary";
import AdminStaffScheduleFallback from "./AdminStaffSchedule";
import AddApointmnet from "./AddApointmnet";


export default function SalonAdminShell() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />

      {/* Main */}
      {/* Sidebar button "Dashboard" points to /adminDashboard */}
      <Route path="adminDashboard" element={<AdminDashboard />} />
      <Route path="adminAppointments" element={<AdminBookings />} />
      <Route path="adminStaff" element={<Staff />} />
      <Route path="adminServices" element={<Services />} />

      {/* Support routes referenced by AdminDashboard quick actions */}
      <Route path="AddAppointment" element={<AddApointmnet />} />
      <Route path="AddStaff" element={<Staff />} />
      <Route path="Billing" element={<div className="text-white">Billing page not implemented yet.</div>} />
      <Route path="Reports" element={<div className="text-white">Reports page not implemented yet.</div>} />

      {/* Business */}
      <Route path="adminBilling" element={<div className="text-white">Billing page not implemented yet.</div>} />
      <Route path="adminReviews" element={<div className="text-white">Reviews page not implemented yet.</div>} />
      <Route path="adminSalary" element={<AdminSalary />} />

      <Route path="*" element={<Navigate to="adminDashboard" replace />} />
    </Routes>
  );
}
