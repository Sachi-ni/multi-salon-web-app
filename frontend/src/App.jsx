import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/register.jsx";
import Main from "./pages/dashboard.jsx";

import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Profile from "./pages/superadmin/profile.jsx";

import CustomerHome from './pages/customer/Dashboard';
import StaffAdminDashboard from './pages/admin/Dashboard';
import SuperAdminDashboard from './pages/superadmin/Dashboard';


import Revenue from "./pages/superadmin/Revenue.jsx";
import AddSalon from "./pages/superadmin/AddSalon.jsx";
import AddStaff from "./pages/superadmin/AddStaff.jsx";
import Staff from "./pages/superadmin/Staff.jsx";
import Appointments from "./pages/superadmin/Appointments.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import Salons from "./pages/superadmin/Salons.jsx";
import AddAppointment from "./pages/superadmin/AddAppointment.jsx";


import CustomerAddAppointment from './pages/customer/AddAppointment'; // Correct based on your structure

function App() {
  return (
    <BrowserRouter>
      {/* All Routes MUST be inside this container */}
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/staffadmin" element={<StaffAdminDashboard />} />
        <Route path="/admin" element={<Navigate to="/SuperAdminDashboard" />} />

        <Route path="/customer/add-appointment" element={<CustomerAddAppointment />} />


        <Route
          path="/SuperAdminDashboard"
          element={
            <DashboardLayout>
              <SuperAdminDashboard />
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
      </Routes>


    </BrowserRouter>
  );
}

export default App;