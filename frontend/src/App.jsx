import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Dashboard from "./pages/superadmin/Dashboard.jsx";
import Revenue from "./pages/superadmin/Revenue.jsx";
import AddSalon from "./pages/superadmin/AddSalon.jsx";
import AddStaff from "./pages/superadmin/AddStaff.jsx";
import Staff from "./pages/superadmin/Staff.jsx";
import Appointments from "./pages/superadmin/Appointments.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import Salons from "./pages/superadmin/Salons.jsx";
import AddAppointment from "./pages/superadmin/AddAppointment.jsx";

function App() {
  return (
    <BrowserRouter>
      {/* All Routes MUST be inside this container */}
      <Routes>
        <Route path="/" element={<Navigate to="/Dashboard" />} />

        <Route
          path="/Dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
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