import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSalons, getSalon, updateSalon, deleteSalon } from "../../services/salonService";
import {
  Plus, ArrowUpDown, Store, Search, LayoutGrid, List,
  MapPin, User, Users, Coins, ExternalLink, MoreVertical,
  Pencil, Trash2, UserPlus, Scissors, Building2, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";
import clsx from "clsx";

const API_BASE = "http://localhost:5000";

const TIME_SLOTS = [];
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, "0");
  TIME_SLOTS.push(`${hour}:00`);
  TIME_SLOTS.push(`${hour}:30`);
}
const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const COMMON_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
]);
const SRI_LANKAN_PHONE_PATTERN = /^(?:\+94|0)\d{9}$/;
const COMMON_PASSWORDS = new Set(["123456", "12345678", "password", "password123", "qwerty"]);
const normalizePhone = (phone) => phone.trim().replace(/[\s()-]/g, "");

const validatePhone = (phone, label) => {
  const normalizedPhone = normalizePhone(phone);
  return normalizedPhone && !SRI_LANKAN_PHONE_PATTERN.test(normalizedPhone)
    ? `Enter a valid ${label} phone number (for example, 0771234567 or +94771234567).`
    : "";
};

const validateManagerDetails = ({ email, phone, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return "Enter a valid manager email address.";
  }

  const emailDomain = normalizedEmail.split("@")[1];
  if (normalizedEmail && !COMMON_EMAIL_DOMAINS.has(emailDomain)) {
    return "Manager email must use Gmail, Yahoo, Outlook, or Hotmail (for example, manager@gmail.com).";
  }

  const phoneError = validatePhone(phone, "manager");
  if (phoneError) {
    return phoneError;
  }

  if (password) {
    const isComplex =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*]/.test(password);

    if (!isComplex || COMMON_PASSWORDS.has(password.toLowerCase())) {
      return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }
  }

  return "";
};

/* Helper to render salon logo or fallback icon */
const SalonLogo = ({ salon, className = "w-full h-full object-cover" }) => {
  if (salon?.logo) {
    const src = salon.logo.startsWith("http")
      ? salon.logo
      : `${API_BASE}/${salon.logo.replace(/\\/g, "/")}`;
    return (
      <img
        src={src}
        alt={`${salon.name || "Salon"} logo`}
        className={className}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <Store className="w-6 h-6" />
  );
};

/* ── Salon Card Component ── */
const SalonCard = ({ salon, onView, onEdit, onDelete, index }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-amber-400/40 hover:-translate-y-1 hover:shadow-card-hover flex flex-col justify-between"
    >
      <div>
        {/* Top Gradient Accent Line */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        <div className="p-5">
          {/* Header Row: Icon + Name + Phone + Menu */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0 text-amber-400 overflow-hidden group-hover:border-amber-400/50 transition-colors">
                <SalonLogo salon={salon} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-white truncate leading-tight group-hover:text-amber-400 transition-colors">
                  {salon.name}
                </h3>
                <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{salon.location || "No address listed"}</span>
                </p>
                {salon.phone && (
                  <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                    <Phone className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
                    <span className="truncate">{salon.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Three-dot Action Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenMenu(!openMenu)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-surface-2 hover:text-white transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {openMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 w-40 bg-surface-2 border border-border rounded-xl shadow-modal py-1.5 z-50"
                  >
                    <button
                      onClick={() => { setOpenMenu(false); onEdit(salon._id); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors hover:bg-white/[0.04] text-neutral-300 hover:text-white"
                    >
                      <Pencil className="w-3.5 h-3.5 text-info" /> Edit Salon
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => { setOpenMenu(false); onDelete(salon._id); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors hover:bg-danger-dim text-danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Salon
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-surface-2/60 border border-border/70 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-wider">Manager</span>
              <div className="mt-0.5 space-y-0.5">
                <span className="text-xs font-extrabold text-white truncate flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{salon.managerName || "Unassigned"}</span>
                </span>
                {salon.managerPhone && (
                  <span className="text-[0.7rem] font-medium text-amber-300/90 truncate flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-amber-400/80 flex-shrink-0" />
                    <span className="truncate">{salon.managerPhone}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="bg-surface-2/60 border border-border/70 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-wider">Staff Count</span>
              <span className="text-xs font-extrabold text-white mt-0.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
                {salon.staffCount || 0} Members
              </span>
            </div>
          </div>

          {/* Revenue */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-neutral-400 font-medium">Est. Revenue:</span>
            <span className="text-amber-400 font-black flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              LKR {salon.revenue ? Number(salon.revenue).toLocaleString() : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Quick Actions */}
      <div className="px-5 py-3 bg-surface-2/30 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/AddStaff/${salon._id}`)}
            className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-2xs font-extrabold text-neutral-300 hover:border-amber-400/40 hover:text-white transition-all flex items-center gap-1"
            title="Add Staff to this salon"
          >
            <UserPlus className="w-3 h-3 text-amber-400" />
            + Staff
          </button>
          <button
            onClick={() => navigate(`/AddService/${salon._id}`)}
            className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-2xs font-extrabold text-neutral-300 hover:border-amber-400/40 hover:text-white transition-all flex items-center gap-1"
            title="Add Service to this salon"
          >
            <Scissors className="w-3 h-3 text-amber-400" />
            + Service
          </button>
        </div>

        <button
          onClick={() => onView(salon._id)}
          className="px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-2xs font-black text-amber-400 hover:bg-amber-400 hover:text-black transition-all flex items-center gap-1"
        >
          <span>Dashboard</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

/* ── Main Salons Page ── */
const Salons = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salonList, setSalonList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortAsc, setSortAsc] = useState(true);

  const [editSalon, setEditSalon] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editLogo, setEditLogo] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSalons();
      setSalonList(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load salons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    if (location.state?.refreshData) {
      fetchSalons();
    }
  }, [location]);

  const handleView = (id) => navigate(`/salon-admin/${id}/adminDashboard`);

const handleEditOpen = async (id) => {
  try {
    const res = await getSalon(id);

    console.log("EDIT SALON DATA:", res.data);

    setEditSalon(res.data);

    setEditForm({
      ...res.data,
      managerName: res.data.managerName || "",
      managerPhone: res.data.managerPhone || "",
      managerEmail: res.data.managerEmail || "",
      managerPassword: "",
      open_time: res.data.open_time || "",
      close_time: res.data.close_time || "",
    });

    setEditLogo(null);
    setEditLogoPreview("");
    setEditError("");
  } catch (err) {
    console.error(err);
    setError("Failed to load salon details for editing");
  }
};

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => {
      const nextForm = { ...prev, [name]: value };
      if (name === "managerFirstName" || name === "managerLastName") {
        const first = name === "managerFirstName" ? value : (prev.managerFirstName || "");
        const last = name === "managerLastName" ? value : (prev.managerLastName || "");
        nextForm.managerName = `${first} ${last}`.trim();
      }
      return nextForm;
    });
  };

  const handleEditLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setEditLogo(null);
      setEditLogoPreview("");
      return;
    }

    setEditLogo(file);
    setEditLogoPreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateManagerDetails({
      email: editForm.managerEmail || "",
      phone: editForm.managerPhone || "",
      password: editForm.managerPassword || "",
    });

    if (validationError) {
      setEditError(validationError);
      return;
    }

    const salonPhoneError = validatePhone(editForm.phone || "", "salon");
    if (salonPhoneError) {
      setEditError(salonPhoneError);
      return;
    }

    if (editForm.open_time && editForm.close_time && editForm.open_time >= editForm.close_time) {
      setEditError("Opening time must be earlier than closing time.");
      return;
    }

    setEditError("");
    setEditLoading(true);

    try {
      const data = new FormData();

      [
        "name",
        "phone",
        "location",
        "about",
        "managerName",
        "managerPhone",
        "managerEmail",
        "managerPassword",
        "open_time",
        "close_time",
      ].forEach((key) => {
        if (
          editForm[key] !== undefined &&
          editForm[key] !== null
        ) {
          data.append(key, editForm[key]);
        }
      });

      // Append new logo if selected
      if (editLogo) {
        data.append("logo", editLogo);
      }

      await updateSalon(editSalon._id, data);

      setEditSalon(null);
      setEditLogo(null);
      setEditLogoPreview("");

      await fetchSalons();
    } catch (err) {
      console.error(err);

      setEditError(
        err.response?.data?.message ||
        "Failed to update salon"
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteSalon(deleteId);
      setDeleteId(null);
      await fetchSalons();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete salon");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSortByName = () => {
    setSortAsc(!sortAsc);
  };

  const filteredSalons = useMemo(() => {
    let list = salonList.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const loc = (s.location || "").toLowerCase();
      const mgr = (s.managerName || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || loc.includes(term) || mgr.includes(term);
    });

    list.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      return sortAsc ? (nameA > nameB ? 1 : -1) : (nameA < nameB ? 1 : -1);
    });

    return list;
  }, [salonList, searchTerm, sortAsc]);

  const totalStaffCount = useMemo(() => {
    return salonList.reduce((sum, s) => sum + (s.staffCount || 0), 0);
  }, [salonList]);

  return (
    <div className="space-y-6">
      <PageHeader title="Salon Directory" subtitle="All registered salon locations and branch management" backTo="/superAdminDashboard">
        <Button variant="primary" icon={Plus} onClick={() => navigate("/AddSalon")}>
          Register New Salon
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-dim border border-danger-border text-sm text-danger">
          <span className="flex-1 font-semibold">{error}</span>
          <button onClick={() => setError("")} className="text-danger hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && salonList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-neutral-400">Registered Salons:</span>
            <span className="text-sm font-black text-white">{salonList.length}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-neutral-400">Total Staff Across Salons:</span>
            <span className="text-sm font-black text-white">{totalStaffCount}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <Badge variant="success" dot={true}>Active Locations</Badge>
          </div>
        </div>
      )}

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              placeholder="Search salon by name, location, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 font-medium"
            />
          </div>

          {/* Sort Button */}
          <button
            onClick={handleSortByName}
            className="px-4 py-2.5 rounded-xl bg-surface border border-border text-xs font-bold text-white hover:border-amber-400/40 transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Sort: {sortAsc ? "A — Z" : "Z — A"}</span>
          </button>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              viewMode === "grid"
                ? "bg-amber-400 text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            )}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={clsx(
              "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              viewMode === "table"
                ? "bg-amber-400 text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            )}
            title="Table View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 bg-surface border border-border rounded-2xl space-y-4 animate-pulse">
              <div className="w-12 h-12 bg-surface-2 rounded-2xl" />
              <div className="h-4 w-32 bg-surface-2 rounded" />
              <div className="h-3 w-20 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      ) : filteredSalons.length === 0 ? (
        <EmptyState
          title="No salons found"
          description="No salon locations match your search criteria."
          actionLabel="Add Salon"
          onAction={() => navigate("/AddSalon")}
          icon={Store}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSalons.map((salon, index) => (
            <SalonCard
              key={salon._id}
              salon={salon}
              index={index}
              onView={handleView}
              onEdit={handleEditOpen}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Table>
          <Table.Head>
            <Table.Th>Salon Branch</Table.Th>
            <Table.Th>Location & Phone</Table.Th>
            <Table.Th>Manager Details</Table.Th>
            <Table.Th>Staff Count</Table.Th>
            <Table.Th align="right">Est. Revenue</Table.Th>
            <Table.Th align="right">Actions</Table.Th>
          </Table.Head>
          <Table.Body>
            {filteredSalons.map((salon) => (
              <tr key={salon._id} className="hover:bg-surface-2/60 transition-colors">
                <Table.Td bold className="flex items-center gap-3">
<div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-xs overflow-hidden">
                    <SalonLogo salon={salon} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white font-extrabold text-sm">{salon.name}</span>
                </Table.Td>
                <Table.Td className="text-neutral-300 text-xs">
                  <div>{salon.location || "N/A"}</div>
                  {salon.phone && (
                    <div className="text-[0.7rem] text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5 text-amber-400/80" />
                      {salon.phone}
                    </div>
                  )}
                </Table.Td>
                <Table.Td className="text-amber-400 font-semibold text-xs">
                  <div>{salon.managerName || "Unassigned"}</div>
                  {salon.managerPhone && (
                    <div className="text-[0.7rem] text-neutral-300 flex items-center gap-1 font-normal mt-0.5">
                      <Phone className="w-2.5 h-2.5 text-amber-400/80" />
                      {salon.managerPhone}
                    </div>
                  )}
                </Table.Td>
                <Table.Td className="text-xs text-neutral-300">{salon.staffCount || 0} Staff</Table.Td>
                <Table.Td align="right" className="text-amber-400 font-extrabold text-xs">
                  LKR {salon.revenue ? Number(salon.revenue).toLocaleString() : "0"}
                </Table.Td>
                <Table.Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleView(salon._id)}
                      className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400 hover:text-black transition-colors"
                      title="Open Dashboard"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditOpen(salon._id)}
                      className="p-1.5 rounded-lg bg-surface-2 text-info hover:bg-info/20 transition-colors"
                      title="Edit Salon"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(salon._id)}
                      className="p-1.5 rounded-lg bg-surface-2 text-danger hover:bg-danger/20 transition-colors"
                      title="Delete Salon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Table.Td>
              </tr>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editSalon} onClose={() => setEditSalon(null)} title="Edit Salon Details" maxWidth="max-w-md">
        <form onSubmit={handleEditSubmit} autoComplete="off" className="space-y-4 pt-1">
          {editError && (
            <div className="px-3 py-2.5 rounded-xl bg-danger-dim border border-danger-border text-xs text-danger font-semibold">
              {editError}
            </div>
          )}

          <Input
            label="Salon Name"
            name="name"
            value={editForm.name || ""}
            onChange={handleEditChange}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            value={editForm.phone || ""}
            onChange={handleEditChange}
                pattern="(?:\\+94|0)[0-9]{9}"
                title="Use 0771234567 or +94771234567"
          />

          <Input
            label="Location Address"
            name="location"
            value={editForm.location || ""}
            onChange={handleEditChange}
          />

          <div>
            <label className="block text-[0.68rem] font-extrabold text-neutral-400 tracking-wider uppercase mb-1.5">
              About Salon
            </label>

            <textarea
              name="about"
              value={editForm.about || ""}
              onChange={handleEditChange}
              rows={4}
              placeholder="Enter information about this salon..."
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.68rem] font-extrabold text-neutral-400 tracking-wider uppercase mb-1.5">
                Opening Time
              </label>
              <select
                name="open_time"
                value={editForm.open_time || ""}
                onChange={handleEditChange}
                required
                className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select opening time</option>
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.68rem] font-extrabold text-neutral-400 tracking-wider uppercase mb-1.5">
                Closing Time
              </label>
              <select
                name="close_time"
                value={editForm.close_time || ""}
                onChange={handleEditChange}
                required
                className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select closing time</option>
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salon Logo Upload */}
          <div>
            <label className="block text-[0.68rem] font-extrabold text-neutral-400 tracking-wider uppercase mb-1.5">
              Salon Logo <span className="text-amber-400/60 lowercase tracking-widest ml-1 font-bold">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border overflow-hidden flex-shrink-0 flex items-center justify-center text-neutral-400">
                {editLogoPreview ? (
                  <img src={editLogoPreview} alt="New salon logo preview" className="w-full h-full object-cover" />
                ) : editSalon?.logo ? (
                  <SalonLogo salon={editSalon} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditLogoChange}
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-black file:cursor-pointer"
              />
            </div>
            <p className="text-[0.6rem] text-neutral-500 mt-1">Upload a new logo for this salon. It will appear in the manager header and salon directory.</p>
          </div>

          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-3">
              Manager Details
            </h4>

            <div className="space-y-3">
              <Input
                label="Manager Name"
                name="managerName"
                value={editForm.managerName || ""}
                onChange={handleEditChange}
                placeholder="Enter manager full name"
              />

              <Input
                label="Manager Phone Number"
                name="managerPhone"
                value={editForm.managerPhone || ""}
                onChange={handleEditChange}
                placeholder="Enter manager phone number"
                pattern="(?:\\+94|0)[0-9]{9}"
                title="Use 0771234567 or +94771234567"
              />

              <Input
                label="Manager Email"
                name="managerEmail"
                type="email"
                value={editForm.managerEmail || ""}
                onChange={handleEditChange}
                placeholder="Enter manager email"
              />

              <Input
                label="Manager Password"
                name="managerPassword"
                type="password"
                placeholder="Leave blank to keep current password"
                value={editForm.managerPassword || ""}
                onChange={handleEditChange}
                minLength={8}
              />
            </div>
          </div>

          <Modal.Actions>
            <Button variant="ghost" type="button" onClick={() => setEditSalon(null)} disabled={editLoading}>Cancel</Button>
            <Button variant="primary" type="submit" loading={editLoading}>Save Changes</Button>
          </Modal.Actions>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="🗑️ Delete Salon Location?" maxWidth="max-w-sm">
        <p className="text-xs text-neutral-300 py-3 text-center leading-relaxed">
          Are you sure you want to delete this salon? All associated data and assignments will be removed.
        </p>
        <Modal.Actions className="justify-center">
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteLoading}>Delete Salon</Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export default Salons;