import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/register.jsx";
import Main from "./pages/dashboard.jsx";

import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Profile from "./pages/superadmin/profile.jsx";
import Dashboard from "./pages/superadmin/Dashboard.jsx";
import Revenue from "./pages/superadmin/Revenue.jsx";
import AddSalon from "./pages/superadmin/AddSalon.jsx";
import AddStaff from "./pages/superadmin/AddStaff.jsx";
import Staff from "./pages/superadmin/Staff.jsx";
import Appointments from "./pages/superadmin/Appointments.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import Salons from "./pages/superadmin/Salons.jsx";
import AddAppointment from "./pages/superadmin/AddAppointment.jsx";

import AdminDashboard from "./pages/admin/Dashboard.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Super Admin Routes */}
        <Route
          path="/Dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/Profile"
          element={
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          }
        />

        <Route
          path="/Revenue"
          element={
            <DashboardLayout>
              <Revenue />
            </DashboardLayout>
          }
        />

        <Route
          path="/Staff"
          element={
            <DashboardLayout>
              <Staff />
            </DashboardLayout>
          }
        />

        <Route
          path="/AddSalon"
          element={
            <DashboardLayout>
              <AddSalon />
            </DashboardLayout>
          }
        />

        <Route
          path="/AddStaff"
          element={
            <DashboardLayout>
              <AddStaff />
            </DashboardLayout>
          }
        />

        <Route
          path="/Appointments"
          element={
            <DashboardLayout>
              <Appointments />
            </DashboardLayout>
          }
        />

        <Route
          path="/Analytics"
          element={
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          }
        />

        <Route
          path="/salons"
          element={
            <DashboardLayout>
              <Salons />
            </DashboardLayout>
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

        {/* Admin Route */}
        <Route
          path="/admin/dashboard/:id"
          element={<AdminDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;