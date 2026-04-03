import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Dashboard from "./pages/superadmin/Dashboard.jsx";
import Revenue from "./pages/superadmin/Revenue.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/Dashboard" />} />

        {/* Dashboard */}
        <Route
          path="/Dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        {/* Revenue */}
        <Route
          path="/Revenue"
          element={
            <DashboardLayout>
              <Revenue />
            </DashboardLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

