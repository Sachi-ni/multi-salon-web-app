import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "./AdminDashboard";
import AdminBookings from "./AdminBookings";
import Services from "./Services";
import Staff from "./Staff";
import AdminSalary from "./AdminSalary";

import AddApointmnet from "./AddApointmnet";
import Billing from "./Billing";
import AdminReviews from "./AdminReviews";
import AdminAnalytics from "./AdminAnalytics";
import AdminSchedule from "./AdminSchedule";
import SalonPhotos from "./SalonPhotos";


export default function SalonAdminShell() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />

      {/* Main */}
      {/* Sidebar button "Dashboard" points to /adminDashboard */}
      <Route path="adminDashboard" element={<AdminDashboard />} />
      <Route path="adminAppointments" element={<AdminBookings />} />
      <Route path="adminSchedule" element={<AdminSchedule />} />
      <Route path="adminStaff" element={<Staff />} />
      <Route path="adminServices" element={<Services />} />

      {/* Support routes referenced by AdminDashboard quick actions */}
      <Route path="AddAppointment" element={<AddApointmnet />} />
      <Route path="AddStaff" element={<Staff />} />
      <Route path="Billing" element={<Billing />} />
      <Route path="Reports" element={<div className="text-white">Reports page not implemented yet.</div>} />

      {/* Business */}
<Route path="adminBilling" element={<Billing />} />
      <Route path="adminReviews" element={<AdminReviews />} />
      <Route path="adminSalary" element={<AdminSalary />} />
      <Route path="adminAnalytics" element={<AdminAnalytics />} />

      {/* Salon Photo Gallery management */}
      <Route path="adminPhotos" element={<SalonPhotos />} />

      <Route path="*" element={<Navigate to="adminDashboard" replace />} />
    </Routes>
  );
}
