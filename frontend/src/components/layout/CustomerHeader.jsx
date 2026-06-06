import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, Menu, LogOut, User, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../services/notificationService";

const CustomerHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      getNotifications().then(res => setNotifications(res.data)).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/"; // hard redirect instead of navigate
  };

  const handleReadNotification = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "CU";

  return (
    <header className="h-header bg-surface/90 backdrop-blur-glass border-b border-border flex items-center px-5 gap-3 fixed top-0 left-0 right-0 z-[200]">
      <button onClick={onToggleSidebar} className="lg:hidden flex p-1.5 cursor-pointer">
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 text-lg font-black text-accent whitespace-nowrap tracking-tight">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
          S
        </div>
        <span className="text-white">Salon</span>Hub
      </div>

      {/* Customer badge */}
      <div className="px-2.5 py-0.5 rounded-full text-[0.6rem] font-extrabold tracking-widest uppercase border bg-success-dim border-success-border text-success">
        CUSTOMER
      </div>

      <div className="flex-1" />

      <div className="relative" ref={notifRef}>
        <button 
          onClick={() => setNotifOpen(!notifOpen)}
          className="w-9 h-9 rounded-lg bg-transparent border border-border flex items-center justify-center text-muted-2 hover:bg-surface-2 hover:text-white hover:border-border-hover transition-all duration-150 relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-primary text-[0.6rem] font-black rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-modal py-2 animate-scale-in z-50">
            <div className="flex items-center justify-between px-4 pb-2 border-b border-border">
              <h3 className="text-white font-extrabold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleReadAll} className="text-accent text-xs font-bold hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-2 text-xs">No notifications yet</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n._id} 
                    onClick={() => !n.is_read && handleReadNotification(n._id)}
                    className={clsx(
                      "p-3 border-b border-border/50 hover:bg-surface-2 transition-colors cursor-pointer",
                      !n.is_read ? "bg-accent/5" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className={clsx("text-xs font-bold", !n.is_read ? "text-accent" : "text-white")}>{n.title}</p>
                      <span className="text-[0.6rem] text-muted-2 whitespace-nowrap ml-2">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-2 leading-snug">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-xs font-black text-primary flex-shrink-0 group-hover:bg-accent-hover transition-colors duration-150">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-[0.82rem] font-bold text-white leading-tight">{user?.name}</div>
            <div className="text-[0.67rem] text-muted-2 leading-tight">{user?.email}</div>
          </div>
          <ChevronDown className={clsx("w-3.5 h-3.5 text-muted-2 transition-transform duration-200 hidden sm:block", dropdownOpen && "rotate-180")} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-modal py-1.5 animate-scale-in z-50">
            <button
              onClick={() => { navigate("/customer/profile"); setDropdownOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm text-muted-2 hover:text-white hover:bg-white/[0.04] flex items-center gap-2.5 transition-colors duration-150"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger-dim flex items-center gap-2.5 transition-colors duration-150"
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

export default CustomerHeader;