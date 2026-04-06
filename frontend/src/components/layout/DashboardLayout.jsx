import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <>
      <Header onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} />
      <div
        style={{
          marginLeft: sidebarOpen ? "var(--sw)" : "0",
          paddingTop: "var(--hh)",
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingBottom: "20px",
          minHeight: "100vh",
          transition: "margin-left 0.2s ease",
          background: "var(--bg)",
        }}
      >
        <div style={{ padding: "10px", maxWidth: "1500px", margin: "0 auto" }}>
          {children}
        </div>
      </div>
    </>
  );
};

export default MainLayout;