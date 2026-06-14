import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import clsx from "clsx";

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isSuperAdmin = user?.role === "super-admin";

  // When viewing a per-salon shell (/salon-admin/:salonId/*), show the selected salon in the header.
  // We still keep Auth user info for email/initials when salon data is not available.
  const headerSalonName = (() => {
    if (user?.role !== "super-admin") return user?.salon?.name;
    return user?.salon?.name;
  })();

  const displayName = isSuperAdmin
    ? user?.name || headerSalonName || "Super Admin"
    : user?.salon?.name || "Salon Manager";

  const displayEmail = isSuperAdmin
    ? user?.email || "admin@salonhub.com"
    : user?.email || "manager@salonhub.com";


  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-header bg-surface/90 backdrop-blur-glass border-b border-border flex items-center px-5 gap-3 fixed top-0 left-0 right-0 z-[200]">
      
      {/* Mobile Menu */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden flex items-center justify-center p-1.5"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* App / Salon Name */}
      <div className="flex items-center gap-2 font-black text-accent">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-primary">
          {(headerSalonName || user?.salon?.name || "Salon").charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col leading-tight">
          <span className="text-white text-sm font-bold">
            {user?.salon?.name}
          </span>

          <span className="text-white text-xs opacity-80">
            Admin Panel
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-primary font-black text-xs">
            {initials}
          </div>

          {/* Name + Email */}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-bold text-white leading-tight">
              {displayName}
            </div>
            <div className="text-xs text-muted-2 leading-tight">
              {displayEmail}
            </div>
          </div>

          <ChevronDown
            className={clsx(
              "w-4 h-4 text-muted-2 transition-transform",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-modal py-1.5 z-50">
            
            <button
              onClick={() => {
                navigate("/profile");
                setDropdownOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-muted-2 hover:text-white hover:bg-white/5 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Profile
            </button>

            <div className="my-1 border-t border-border" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;