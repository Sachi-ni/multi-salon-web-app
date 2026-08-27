import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, Menu, LogOut, User, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../services/notificationService";
import { getSalon } from "../../services/salonService";
import { API_BASE } from "../../config";

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [salon, setSalon] = useState(null);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const displayName = user?.name || "Admin User";
  const displayEmail = user?.email || "";

  // Fetch the salon name & logo for managers / salon staff
  useEffect(() => {
    if (user?.salon_id) {
      getSalon(user.salon_id)
        .then((res) => setSalon(res.data || null))
        .catch(() => setSalon(null));
    }
  }, [user?.salon_id]);

  useEffect(() => {
    if (user) {
      getNotifications()
        .then((res) => setNotifications(res.data))
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleReadNotification = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await handleReadNotification(n._id);
    }
    setNotifOpen(false);

    if (n.appointment_id) {
      if (user?.role === "super-admin") {
        navigate(`/Appointments?highlight=${n.appointment_id}`);
      } else {
        navigate(`/salon-admin/${user.salon_id}/adminAppointments?highlight=${n.appointment_id}`);
      }
    }
  };

  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  const roleBadgeColor = {
    "super-admin":
      "bg-accent-muted border-accent/35 text-accent",
    "staff-admin":
      "bg-info-dim border-info-border text-info",
    admin:
      "bg-purple-dim border-purple-border text-purple",
  };

  const roleDisplay =
    user?.role?.replace("-", " ").toUpperCase() ||
    "ADMIN";

  const badgeClass =
    roleBadgeColor[user?.role] ||
    roleBadgeColor["super-admin"];

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "SA";

  return (
    <header className="h-header bg-surface/90 backdrop-blur-glass border-b border-border flex items-center px-5 gap-3 fixed top-0 left-0 right-0 z-[200]">

      {/* Mobile Menu */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden flex items-center justify-center p-1.5"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Logo - show salon name & logo for salon users, else SalonHub */}
      <div className="flex items-center gap-2 text-lg font-black text-accent whitespace-nowrap tracking-tight">
        {salon?.name ? (
          <>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm font-black text-primary flex-shrink-0 overflow-hidden">
              {salon.logo ? (
                <img
                  src={salon.logo.startsWith("http") ? salon.logo : `${API_BASE}/${salon.logo.replace(/\\/g, "/")}`}
                  alt={`${salon.name} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                (salon.name.charAt(0) || "S").toUpperCase()
              )}
            </div>
            <span className="text-white max-w-[200px] truncate">{salon.name}</span>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
              S
            </div>
            <span className="text-white">Salon</span>Hub
          </>
        )}
      </div>

      {/* Role Badge */}
      <div className={clsx("px-2.5 py-0.5 rounded-full text-[0.6rem] font-extrabold tracking-widest uppercase whitespace-nowrap border", badgeClass)}>
        {roleDisplay}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setNotifOpen(!notifOpen);
            if (!notifOpen && user) {
              getNotifications().then(res => setNotifications(res.data)).catch(console.error);
            }
          }}
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
                    onClick={() => handleNotificationClick(n)}
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

      {/* Separator */}
      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
{/* Avatar */}
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-primary font-black text-xs overflow-hidden">
            {user?.image ? (
              <img
                src={user.image.startsWith("http") ? user.image : `${API_BASE}/${user.image.replace(/\\/g, "/")}`}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              initials
            )}
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
                navigate(user?.role === "super-admin" ? "/Profile" : "/editProfile");
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