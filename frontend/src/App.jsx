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
import Main from "./pages/customer/Dashboard.jsx";

// Super Admin Pages
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Profile from "./pages/superadmin/profile.jsx";
import SuperAdminDashboard from "./pages/superadmin/Dashboard.jsx";
import Revenue from "./pages/superadmin/Revenue.jsx";
import AddSalon from "./pages/superadmin/AddSalon.jsx";
import AddStaff from "./pages/superadmin/AddStaff.jsx";
import Staff from "./pages/superadmin/Staff.jsx";
import Appointments from "./pages/superadmin/Appointments.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import Salons from "./pages/superadmin/Salons.jsx";
import AddAppointment from "./pages/superadmin/AddAppointment.jsx";

import { useAuth } from "./context/AuthContext";

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
        <Route path="/" element={<Main />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/editProfile" element={<Edit />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

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
      </Routes>


    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;