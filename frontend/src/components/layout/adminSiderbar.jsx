import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  DollarSign,
  Receipt,
  Star,
  Wallet,
  LogOut,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  {
    group: "Main",
    items: [
      {
        label: "Dashboard",
        path: "/adminDashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Appointments",
        path: "/adminAppointments",
        icon: Calendar,
      },
      {
        label: "Staff",
        path: "/adminStaff",
        icon: Users,
      },
      {
        label: "Services",
        path: "/adminServices",
        icon: Scissors,
      },
    ],
  },
  {
    group: "Business",
    items: [
      {
        label: "Revenue",
        path: "/adminRevenue",
        icon: DollarSign,
      },
      {
        label: "Billing",
        path: "/adminBilling",
        icon: Receipt,
      },
      {
        label: "Reviews",
        path: "/adminReviews",
        icon: Star,
      },
      {
        label: "Salary",
        path: "/adminSalary",
        icon: Wallet,
      },
    ],
  },
];

const AdminSidebar = ({ isOpen = true, onClose, basePath = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();


  const isActive = (path) => {
    const full = basePath ? `${basePath}${path}` : path;
    return location.pathname === full;
  };


  const handleLogout = () => {
    logout();
    navigate("/");
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
          "fixed top-header bottom-0 left-0 z-[150] w-sidebar",
          "bg-black border-r border-yellow-500/20",
          "flex flex-col overflow-y-auto",
          "transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 py-3">
          {navItems.map((group) => (
            <div key={group.group}>
              <div className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">
                {group.group}
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                    <button
                      key={item.path}
                      onClick={() => navigate(basePath ? `${basePath}${item.path}` : item.path)}

                    className={clsx(
                      "w-[calc(100%-16px)] mx-2",
                      "flex items-center gap-3",
                      "px-4 py-3 rounded-lg",
                      "transition-all duration-200",
                      active
                        ? "bg-yellow-500/10 text-yellow-400 border-l-4 border-yellow-400"
                        : "text-gray-400 hover:bg-yellow-500/5 hover:text-yellow-300"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-yellow-500/10">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-400">
              System Online
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                       text-red-400 border border-red-500/20
                       hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;