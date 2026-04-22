import { useState } from "react";
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/signup.jsx';
import Profile from './pages/superadmin/profile.jsx';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/superadmin/profile" element={<Profile/>} />
      </Routes>
    </Router>
  );
}

export default App;