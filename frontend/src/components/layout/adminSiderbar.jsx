import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Receipt,
  Star,
  Wallet,
  LogOut,
  BarChart2,
  Image,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const AdminSidebar = ({
  isOpen = false,
  onClose,
  basePath = "",
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isStandardStaff = user?.role && !["super-admin", "manager"].includes(user.role);

  const getNavItems = () => {
    if (isStandardStaff) {
      return [
        {
          group: "Main",
          items: [
            { label: "Dashboard", path: "/staff/dashboard", icon: LayoutDashboard },
            // Optional: Staff can view their own schedule, which is handled in staffDashboard
            // We can leave Appointments out or point it to a specific view if needed,
            // but staffDashboard covers their schedule.
          ],
        },
      ];
    }
    
    return [
      {
        group: "Main",
        items: [
          { label: "Dashboard", path: "/adminDashboard", icon: LayoutDashboard },
          { label: "Appointments", path: "/adminAppointments", icon: Calendar },
          { label: "Staff", path: "/adminStaff", icon: Users },
          { label: "Services", path: "/adminServices", icon: Scissors },
        ],
      },
      {
        group: "Business",
items: [
          { label: "Analytics", path: "/adminAnalytics", icon: BarChart2 },
          { label: "Report", path: "/adminBilling", icon: Receipt },
          { label: "Reviews", path: "/adminReviews", icon: Star },
          { label: "Salary", path: "/adminSalary", icon: Wallet },
          { label: "Salon Photos", path: "/adminPhotos", icon: Image },
        ],
      },
    ];
  };

  const navItems = getNavItems();


  const isActive = (path) => {
    const full = basePath ? `${basePath}${path}` : path;
    return location.pathname === full;
  };


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[140] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed top-header bottom-0 left-0 z-[150] bg-surface border-r border-border flex flex-col transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "lg:w-[72px] w-sidebar" : "w-sidebar",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-1">
          {navItems.map((group, groupIdx) => (
            <div key={group.group} className="space-y-1">
              {/* Group Label / Divider */}
              {isCollapsed ? (
                groupIdx > 0 && (
                  <div className="hidden lg:block my-2 mx-3 border-t border-border/50" />
                )
              ) : (
                <div className="px-3.5 pt-3 pb-1 text-[0.58rem] font-extrabold text-muted tracking-[0.14em] uppercase">
                  {group.group}
                </div>
              )}

              {isCollapsed && (
                <div className="lg:hidden px-3.5 pt-3 pb-1 text-[0.58rem] font-extrabold text-muted tracking-[0.14em] uppercase">
                  {group.group}
                </div>
              )}

              {/* Items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <div key={item.path} className="relative group">
                    <button
                      onClick={() => handleNav(basePath ? `${basePath}${item.path}` : item.path)}
                      title={item.label}
                      className={clsx(
                        "transition-all duration-150 flex items-center text-left rounded-xl font-medium",
                        isCollapsed
                          ? "lg:w-11 lg:h-11 lg:mx-auto lg:p-0 lg:justify-center w-[calc(100%-16px)] mx-2 px-3 py-2.5 gap-3 text-[0.82rem]"
                          : "w-[calc(100%-16px)] mx-2 px-3 py-2.5 gap-3 text-[0.82rem]",
                        active
                          ? "bg-accent-dim text-accent border border-accent/30 font-semibold shadow-sm shadow-accent/5"
                          : "text-muted-2 hover:bg-white/[0.05] hover:text-white border border-transparent"
                      )}
                    >
                      <Icon className={clsx("w-5 h-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-105", active && "text-accent")} />
                      <span
                        className={clsx(
                          "flex-1 truncate",
                          isCollapsed && "lg:hidden"
                        )}
                      >
                        {item.label}
                      </span>
                    </button>

                    {/* Floating Tooltip (desktop collapsed only) */}
                    {isCollapsed && (
                      <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#18181b] text-white text-xs font-semibold rounded-lg shadow-2xl border border-white/10 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-[250]">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 mt-auto border-t border-border/50 space-y-2">
          {/* Quick Collapse Toggle inside Sidebar on Desktop */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={clsx(
                "hidden lg:flex items-center text-muted-2 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-150",
                isCollapsed
                  ? "w-11 h-11 mx-auto justify-center"
                  : "w-full px-3 py-2 gap-2.5 text-xs font-semibold"
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-accent" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Menu</span>
                </>
              )}
            </button>
          )}

          {user?.role === "super-admin" && (
            <div className="relative group">
              <button
                onClick={() => handleNav("/superAdminDashboard")}
                title="Back to Hub"
                className={clsx(
                  "flex items-center justify-center font-bold text-black bg-amber-400 hover:bg-amber-500 transition-all duration-150 rounded-xl shadow-sm",
                  isCollapsed
                    ? "lg:w-11 lg:h-11 lg:mx-auto lg:p-0 w-full px-3 py-2.5 gap-2 text-[0.82rem]"
                    : "w-full px-3 py-2.5 gap-2 text-[0.82rem]"
                )}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                <span className={clsx("truncate", isCollapsed && "lg:hidden")}>
                  Back to Hub
                </span>
              </button>

              {isCollapsed && (
                <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#18181b] text-amber-400 text-xs font-semibold rounded-lg shadow-2xl border border-white/10 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-[250]">
                  Back to Hub
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <div className="relative group">
            <button
              onClick={handleLogout}
              title="Logout"
              className={clsx(
                "flex items-center font-semibold text-danger border border-danger/25 hover:bg-danger-dim transition-all duration-150 rounded-xl",
                isCollapsed
                  ? "lg:w-11 lg:h-11 lg:mx-auto lg:p-0 lg:justify-center w-full px-3 py-2.5 gap-2.5 text-[0.82rem]"
                  : "w-full px-3 py-2.5 gap-2.5 text-[0.82rem]"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={clsx("flex-1 truncate text-left", isCollapsed && "lg:hidden")}>
                Logout
              </span>
            </button>

            {isCollapsed && (
              <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#18181b] text-rose-400 text-xs font-semibold rounded-lg shadow-2xl border border-white/10 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-[250]">
                Logout
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;