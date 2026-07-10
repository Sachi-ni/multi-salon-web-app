import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, Menu, LogOut, User, ChevronDown, X, Home, Info, Scissors, Store, Users, MessageSquare, Phone, Calendar, CalendarPlus } from "lucide-react";
import clsx from "clsx";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../services/notificationService";

const CustomerHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
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

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await handleReadNotification(n._id);
    }
    setNotifOpen(false);

    if (n.appointment_id) {
      navigate(`/customer/dashboard?highlight=${n.appointment_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "CU";

  const scrollToSection = (href) => {
    setMobileMenuOpen(false);
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }

    if (window.location.pathname !== "/") {
      navigate("/" + href);
      return;
    }

    const element = document.querySelector(href);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  const navLinks = [
    { name: "Home", href: "#home", icon: Home },
    { name: "About", href: "#about", icon: Info },
    { name: "Services", href: "#services", icon: Scissors },
    { name: "Salons", href: "/our-salons", icon: Store },
    { name: "Our Team", href: "/team", icon: Users },
    { name: "Testimonials", href: "#testimonials", icon: MessageSquare },
    { name: "Contact", href: "#contact", icon: Phone },
  ];

  const isDashboard = location.pathname.startsWith("/customer/dashboard");

  return (
    <>
      <header
        className={clsx(
          "h-[64px] flex items-center px-4 md:px-6 fixed top-0 left-0 right-0 z-[200] transition-all duration-500",
          scrolled
            ? "bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-transparent"
        )}
      >
        {/* Subtle gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          onClick={() => navigate("/")}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-[#b8941e] rounded-xl flex items-center justify-center text-sm font-black text-primary shadow-[0_0_20px_rgba(212,175,55,0.25)] group-hover:shadow-[0_0_28px_rgba(212,175,55,0.4)] transition-all duration-300 group-hover:scale-105">
            S
          </div>
          <div className="text-lg font-black tracking-tight">
            <span className="text-white">Salon</span>
            <span className="bg-gradient-to-r from-accent to-[#f0d060] bg-clip-text text-transparent">Hub</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center">
          {/* Main nav links */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-full px-1.5 py-1 mr-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="relative px-3.5 py-1.5 text-[0.8rem] font-semibold text-white/50 hover:text-white rounded-full transition-all duration-300 hover:bg-white/[0.06] group whitespace-nowrap"
              >
                {link.name}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-accent to-[#f0d060] rounded-full group-hover:w-3/4 transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2" />

          {user ? (
            <>
              {/* My Appointments */}
              <button
                onClick={() => navigate("/customer/dashboard")}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-[0.8rem] font-bold transition-all duration-300 mx-2 whitespace-nowrap",
                  isDashboard
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                My Appointments
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-full text-[0.8rem] font-bold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-300 mx-1 whitespace-nowrap"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-4 py-2 rounded-full text-[0.8rem] font-bold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-300 mx-1 whitespace-nowrap"
              >
                Sign Up
              </button>
            </>
          )}

          {/* Book Appointment CTA */}
          <button
            onClick={() => navigate("/book")}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-[0.8rem] font-bold bg-gradient-to-r from-accent to-[#c9a020] text-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_28px_rgba(212,175,55,0.35)] hover:scale-[1.03] transition-all duration-300 whitespace-nowrap mx-2"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Book Now
          </button>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 ml-3">
          {user && (
            <>
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 relative",
                    notifOpen
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-gradient-to-br from-accent to-[#c9a020] text-primary text-[0.55rem] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-3 w-80 bg-[#12121a] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] py-2 z-50" style={{ animation: "scaleIn 0.2s ease-out" }}>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
                      <h3 className="text-white font-extrabold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleReadAll} className="text-accent text-xs font-bold hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-white/30 text-xs">No notifications yet</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            className={clsx(
                              "p-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer",
                              !n.is_read ? "bg-accent/5" : ""
                            )}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className={clsx("text-xs font-bold", !n.is_read ? "text-accent" : "text-white")}>{n.title}</p>
                              <span className="text-[0.6rem] text-white/30 whitespace-nowrap ml-2">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 leading-snug">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={clsx(
                    "flex items-center gap-2 cursor-pointer group pl-1 pr-2 py-1 rounded-xl transition-all duration-200",
                    dropdownOpen ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-[#b8941e] flex items-center justify-center text-[0.7rem] font-black text-primary shadow-[0_0_12px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_18px_rgba(212,175,55,0.3)] transition-all">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-[0.78rem] font-bold text-white leading-tight">{user?.name}</div>
                  </div>
                  <ChevronDown className={clsx("w-3.5 h-3.5 text-white/30 transition-transform duration-300 hidden sm:block", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-52 bg-[#12121a] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] py-2 z-50" style={{ animation: "scaleIn 0.2s ease-out" }}>
                    <div className="px-4 py-2 border-b border-white/[0.06]">
                      <p className="text-white text-sm font-bold">{user?.name}</p>
                      <p className="text-white/30 text-xs truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate("/customer/profile"); setDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white/50 hover:text-white hover:bg-white/[0.04] flex items-center gap-2.5 transition-colors duration-150"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <div className="mx-3 border-t border-white/[0.06]" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[199] xl:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-[64px] left-0 right-0 bg-[#0c0c14]/98 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-y-auto max-h-[calc(100vh-64px)]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideDown 0.3s ease-out" }}
          >
            {/* Nav Links */}
            <div className="p-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.name}
                    onClick={() => scrollToSection(link.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] transition-all text-left"
                  >
                    <Icon className="w-4 h-4 text-accent/60" />
                    <span className="text-sm font-semibold">{link.name}</span>
                  </button>
                );
              })}

              <div className="mx-4 my-2 border-t border-white/[0.06]" />

              {user ? (
                <>
                  <button
                    onClick={() => { navigate("/customer/dashboard"); setMobileMenuOpen(false); }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                      isDashboard
                        ? "bg-accent/10 text-accent"
                        : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-semibold">My Appointments</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] transition-all text-left"
                  >
                    <User className="w-4 h-4 text-accent/60" />
                    <span className="text-sm font-semibold">Login</span>
                  </button>
                  <button
                    onClick={() => { navigate("/signup"); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] transition-all text-left"
                  >
                    <User className="w-4 h-4 text-accent/60" />
                    <span className="text-sm font-semibold">Sign Up</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Book CTA */}
            <div className="p-4 pt-0">
              <button
                onClick={() => { navigate("/book"); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-accent to-[#c9a020] text-primary shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                <CalendarPlus className="w-4 h-4" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default CustomerHeader;