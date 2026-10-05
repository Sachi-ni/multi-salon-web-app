import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getStaff, deleteStaff, updateStaff } from "../../services/staffService";
import { getSalons } from "../../services/salonService";
import { getServices } from "../../services/serviceService";
import useFormValidation from "../../hooks/useFormValidation";
import { validateEmail, validatePassword, validatePhoneSriLankan } from "../../utils/validation";
import StaffUnavailableModal from "../../components/booking/StaffUnavailableModal";
import { 
  Plus, Search, Users, Star, MapPin, 
  MoreVertical, Power, Pencil, Trash2, 
  ChevronDown, LayoutGrid, List, CheckCircle2, XCircle, Coins, Eye, EyeOff,
  Crown, Phone, Mail, Building2, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import clsx from "clsx";
import { mediaUrl } from "../../utils/mediaUrl";

/* ── Skeleton Card ── */
const SkeletonStaffCard = () => (
  <div className="bg-surface border border-border rounded-2xl p-5 animate-pulse space-y-4 shadow-card">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-surface-2" />
        <div className="h-3 w-20 rounded bg-surface-2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full rounded bg-surface-2" />
      <div className="h-3 w-2/3 rounded bg-surface-2" />
    </div>
  </div>
);

/* ── Staff Card Actions Menu ── */
const ActionsMenu = ({ staff, onEdit, onToggleStatus, onDelete, onMarkUnavailable }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-2 hover:bg-surface-2 hover:text-white transition-all duration-150"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-44 bg-surface-2 border border-border rounded-xl shadow-modal py-1.5 z-50"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus(staff); setOpen(false); }}
              className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-muted-2 hover:text-white"
            >
              <Power className="w-3.5 h-3.5 text-accent" />
              {staff.status === "Active" ? "Deactivate Staff" : "Activate Staff"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-muted-2 hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5 text-info" />
              Edit Details
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMarkUnavailable(staff); setOpen(false); }}
              className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors duration-150 hover:bg-danger-dim text-danger"
            >
              <Power className="w-3.5 h-3.5" />
              Mark Unavailable
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(staff._id); setOpen(false); }}
              className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors duration-150 hover:bg-danger-dim text-danger"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Staff
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Branch Manager Card Component ── */
const BranchManagerCard = ({
  manager,
  index,
  totalSalonStaff,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
  onMarkUnavailable,
}) => {
  const name = manager.name || manager.full_name || "Branch Manager";
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "BM";
  const salonName = manager.salon_id?.name || manager.salonName || "Unassigned Salon";
  const isActive = manager.status === "Active";
  const imageUrl = manager.image ? mediaUrl(manager.image) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative bg-gradient-to-br from-surface via-surface to-surface-2 border-2 border-amber-400/30 hover:border-amber-400/80 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_25px_rgba(212,175,55,0.06)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.18)] flex flex-col justify-between"
    >
      <div>
        {/* Top Gold Leadership Banner */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600" />

        <div className="p-5">
          {/* Header Row: Avatar + Name + Role Badge + Actions */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="relative flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md group-hover:border-amber-400 transition-colors duration-200"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={clsx(
                  "w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/25 via-amber-400/15 to-yellow-600/20 border-2 border-amber-400/50 items-center justify-center text-amber-400 font-black text-lg shadow-sm transition-colors duration-200",
                  imageUrl ? "hidden" : "flex"
                )}
              >
                {initials}
              </div>
              <span
                className={clsx(
                  "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface",
                  isActive ? "bg-success animate-pulse" : "bg-neutral-600"
                )}
                title={isActive ? "Active" : "Inactive"}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-400 font-black text-[0.65rem] uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Branch Manager
                </span>
              </div>
              <h3 className="text-base font-black text-white leading-tight truncate group-hover:text-amber-400 transition-colors">
                {name}
              </h3>
              <p className="text-xs text-neutral-400 font-medium flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="truncate">{salonName}</span>
              </p>
            </div>

            <ActionsMenu
              staff={manager}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onMarkUnavailable={onMarkUnavailable}
            />
          </div>

          {/* Quick Contact & Operation Details */}
          <div className="space-y-2 mb-4 bg-surface-2/60 border border-border/60 rounded-xl p-3 text-xs">
            {/* Phone */}
            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Phone className="w-3.5 h-3.5 text-amber-400/90" />
                Phone:
              </span>
              <span className="font-semibold text-white">{manager.phone || "Not provided"}</span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Mail className="w-3.5 h-3.5 text-amber-400/90" />
                Email:
              </span>
              <span className="font-medium text-white truncate max-w-[170px]" title={manager.email}>
                {manager.email || "No email"}
              </span>
            </div>

            {/* Salary */}
            {manager.salary_payment_count_per_day && (
              <div className="flex items-center justify-between text-neutral-300 pt-1.5 border-t border-border/40">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  Salary:
                </span>
                <span className="font-extrabold text-emerald-400">
                  LKR {Number(manager.salary_payment_count_per_day).toLocaleString()}
                  <span className="text-neutral-400 font-normal text-2xs"> / {manager.salary_payment_frequency || "monthly"}</span>
                </span>
              </div>
            )}

            {/* Supervised Staff */}
            <div className="flex items-center justify-between text-neutral-300 pt-1.5 border-t border-border/40">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Supervising:
              </span>
              <span className="font-bold text-white">
                {totalSalonStaff} {totalSalonStaff === 1 ? "Stylist" : "Stylists"}
              </span>
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={onViewDetails}
            className="w-full py-2 px-3 rounded-xl bg-amber-400/10 hover:bg-amber-400 text-amber-400 hover:text-black border border-amber-400/30 hover:border-amber-400 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Info className="w-3.5 h-3.5" />
            View Manager Details
          </button>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="px-5 py-3 bg-surface-2/40 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-extrabold text-white">
            {manager.rating || "0.0"}
          </span>
          <span className="text-2xs text-neutral-500">Rating</span>
        </div>

        <button
          onClick={() => onToggleStatus(manager)}
          title={isActive ? "Deactivate Manager" : "Activate Manager"}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-[0.65rem] font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5",
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700"
          )}
        >
          <Power className="w-3 h-3" />
          {isActive ? "Active" : "Inactive"}
        </button>
      </div>
    </motion.div>
  );
};

/* ── Branch Manager Details Modal ── */
const BranchManagerDetailsModal = ({ manager, totalSalonStaff, isOpen, onClose, onEdit }) => {
  if (!manager) return null;

  const name = manager.name || manager.full_name || "Branch Manager";
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "BM";
  const salonName = manager.salon_id?.name || manager.salonName || "Unassigned Salon";
  const isActive = manager.status === "Active";
  const imageUrl = manager.image ? mediaUrl(manager.image) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👑 Branch Manager Profile" maxWidth="max-w-lg">
      <div className="space-y-5 pt-1">
        {/* Profile Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-surface-2 via-surface-2 to-surface border border-amber-400/30 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={clsx(
                "w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400/50 items-center justify-center text-amber-400 font-black text-xl shadow-sm",
                imageUrl ? "hidden" : "flex"
              )}
            >
              {initials}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 font-black text-2xs uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Branch Manager
              </span>
              <Badge variant={isActive ? "success" : "neutral"} dot>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <h3 className="text-lg font-black text-white truncate">{name}</h3>
            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{salonName}</span>
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Phone */}
          <div className="p-3 rounded-xl bg-surface-2 border border-border/80 space-y-1">
            <span className="text-2xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              Phone Number
            </span>
            <p className="font-bold text-white text-sm">
              {manager.phone ? (
                <a href={`tel:${manager.phone}`} className="hover:text-amber-400 transition-colors">
                  {manager.phone}
                </a>
              ) : (
                <span className="text-neutral-500 font-normal">Not provided</span>
              )}
            </p>
          </div>

          {/* Email */}
          <div className="p-3 rounded-xl bg-surface-2 border border-border/80 space-y-1">
            <span className="text-2xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              Email Address
            </span>
            <p className="font-bold text-white text-sm truncate" title={manager.email}>
              {manager.email ? (
                <a href={`mailto:${manager.email}`} className="hover:text-amber-400 transition-colors">
                  {manager.email}
                </a>
              ) : (
                <span className="text-neutral-500 font-normal">Not provided</span>
              )}
            </p>
          </div>

          {/* Salary Rate */}
          <div className="p-3 rounded-xl bg-surface-2 border border-border/80 space-y-1">
            <span className="text-2xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              Compensation Rate
            </span>
            <p className="font-extrabold text-emerald-400 text-sm">
              LKR {Number(manager.salary_payment_count_per_day || 0).toLocaleString()}
              <span className="text-neutral-400 font-normal text-xs"> / {manager.salary_payment_frequency || "monthly"}</span>
            </p>
          </div>

          {/* Supervised Team */}
          <div className="p-3 rounded-xl bg-surface-2 border border-border/80 space-y-1">
            <span className="text-2xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Supervised Personnel
            </span>
            <p className="font-bold text-white text-sm">
              {totalSalonStaff} {totalSalonStaff === 1 ? "Stylist" : "Stylists"}
            </p>
          </div>
        </div>

        {/* Assigned Branch Card */}
        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">{salonName}</p>
              <p className="text-2xs text-neutral-400">Primary administrative branch assignment</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-400 text-2xs font-bold">
            Assigned Location
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/80">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="primary"
            icon={Pencil}
            onClick={() => {
              onClose();
              onEdit(manager);
            }}
          >
            Edit Manager Details
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/* ── Staff Card Component ── */
const StaffCard = ({ staff, index, onEdit, onToggleStatus, onDelete, onMarkUnavailable }) => {
  const initials = staff.name
    ? staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "S";
  const salonName = staff.salon_id?.name || staff.salonName || "Unassigned Salon";
  const isActive = staff.status === "Active";
  const staffServices = staff.services || [];

  const imageUrl = staff.image
    ? mediaUrl(staff.image)
    : null;

  const maxVisibleServices = 3;
  const visibleServices = staffServices.slice(0, maxVisibleServices);
  const hiddenCount = staffServices.length - maxVisibleServices;
  const hiddenServiceNames = staffServices.slice(maxVisibleServices).map(s => s.service_name || s).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/40 hover:-translate-y-1 hover:shadow-card-hover flex flex-col justify-between"
    >
      <div>
        {/* Top Accent Bar */}
        <div className={clsx(
          "h-1 transition-all duration-300",
          isActive
            ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"
            : "bg-neutral-700"
        )} />

        <div className="p-5">
          {/* Header Row: Avatar + Name + Role + Actions */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="relative flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={staff.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-border/80 group-hover:border-accent/50 transition-colors duration-200"
                  onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                />
              ) : null}
              <div
                className={clsx(
                  "w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-400/10 to-yellow-600/10 border border-amber-400/30 items-center justify-center text-amber-400 font-black text-lg shadow-sm transition-colors duration-200",
                  imageUrl ? "hidden" : "flex"
                )}
              >
                {initials}
              </div>
              <span
                className={clsx(
                  "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface",
                  isActive ? "bg-success animate-pulse" : "bg-neutral-600"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-white leading-tight truncate group-hover:text-amber-400 transition-colors">
                {staff.name || staff.full_name}
              </h3>
              <p className="text-xs text-amber-400/90 font-semibold mt-0.5">
                {staff.role || "Stylist"}
              </p>
            </div>

            <ActionsMenu
              staff={staff}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onMarkUnavailable={onMarkUnavailable}
            />
          </div>

          {/* Details Section */}
          <div className="space-y-2 mb-4 text-xs">
            {/* Salon Branch */}
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-neutral-300 font-medium truncate">{salonName}</span>
            </div>
            
            {/* Daily Salary Rate */}
            {staff.salary_payment_count_per_day && (
              <div className="flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-neutral-300 font-medium">
                  <strong className="text-emerald-400 font-extrabold">LKR {Number(staff.salary_payment_count_per_day).toLocaleString()}</strong> / {staff.salary_payment_frequency || "day"}
                </span>
              </div>
            )}
          </div>

          {/* Assigned Services Pills */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Assigned Services ({staffServices.length})
            </p>
            {staffServices.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                {visibleServices.map((service, sIdx) => (
                  <span
                    key={service._id || sIdx}
                    className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-[0.7rem] font-semibold text-neutral-200 hover:border-amber-400/40 transition-colors"
                  >
                    {service.service_name || service}
                  </span>
                ))}
                {hiddenCount > 0 && (
                  <span
                    title={hiddenServiceNames}
                    className="px-2 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-[0.7rem] font-extrabold text-amber-400 cursor-help"
                  >
                    +{hiddenCount} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-neutral-500 text-xs italic">No services assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="px-5 py-3 bg-surface-2/30 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
<span className="text-xs font-extrabold text-white">
            {staff.rating || "0.0"}
          </span>
        </div>

        <button
          onClick={() => onToggleStatus(staff)}
          title={isActive ? "Deactivate Staff" : "Activate Staff"}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-[0.65rem] font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5",
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700"
          )}
        >
          <Power className="w-3 h-3" />
          {isActive ? "Active" : "Inactive"}
        </button>
      </div>
    </motion.div>
  );
};

/* ── Main Staff Page ── */
const Staff = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedSalon, setSelectedSalon] = useState("All Salons");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editError, setEditError] = useState("");
  const [editEmailSubmitError, setEditEmailSubmitError] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [unavailableStaff, setUnavailableStaff] = useState(null);
  const [frequencyConfirmation, setFrequencyConfirmation] = useState(null);
  const [selectedManagerDetails, setSelectedManagerDetails] = useState(null);

  const optionalValidator = (validator) => (value = "") => (value ? validator(value) : { valid: true, message: "" });
  const { errors: editErrors, handleBlur: handleEditBlur, validateAll: validateStaffEdit, isValid: staffEditIsValid, fieldMessages } = useFormValidation(
    editingStaff ? {
      email: editingStaff.email || "",
      phone: editingStaff.phone || "",
      password: editingStaff.password || "",
    } : { email: "", phone: "", password: "" },
    {
      email: optionalValidator(validateEmail),
      phone: optionalValidator(validatePhoneSriLankan),
      password: optionalValidator(validatePassword),
    }
  );

  const handleEdit = (staff) => {
    setShowEditPassword(false);
    const names = (staff.name || "").split(" ");
    setEditError("");
  setEditEmailSubmitError("");

    const assignedServices = (staff.services || []).map((service) => {
      if (!service) return null;
      if (typeof service === "string") return service;
      if (service._id) return service._id;
      return service;
    }).filter(Boolean);

    setEditingStaff({
      id: staff._id,
      firstName: names[0] || "",
      lastName: names.slice(1).join(" "),
      email: staff.email || "",
      phone: staff.phone || "",
      password: "",
      forcePasswordChange: false,
      salon: staff.salon_id?._id || staff.salon || "",
      services: assignedServices,
      status: staff.status || "Active",
      salaryPaymentFrequency: staff.salary_payment_frequency || "monthly",
      currentPaymentFrequency: staff.salary_payment_frequency || "monthly",
      salaryPaymentCountPerDay: staff.salary_payment_count_per_day || 1,
      picture: null,
      currentImage: staff.image || "",
    });

    setEditModalOpen(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, salonsRes] = await Promise.all([getStaff(), getSalons()]);
      setStaffList(staffRes.data || []);
      setSalons(salonsRes.data || []);
    } catch (err) {
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!editModalOpen || !editingStaff?.salon) {
      setServices([]);
      return;
    }

    const fetchSalonServices = async () => {
      try {
        setServicesLoading(true);
        const res = await getServices(editingStaff.salon);
        setServices(res.data || []);
      } catch (err) {
        console.error("Failed to load services");
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchSalonServices();
  }, [editModalOpen, editingStaff?.salon]);

  const handleEditSalonChange = (salonId) => {
    setEditingStaff({
      ...editingStaff,
      salon: salonId,
      services: [],
    });
  };

  const handleEditServiceToggle = (serviceId) => {
    setEditingStaff((current) => {
      const isSelected = current.services.includes(serviceId);
      return {
        ...current,
        services: isSelected
          ? current.services.filter((id) => id !== serviceId)
          : [...current.services, serviceId],
      };
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this staff member? The system will check for pending salary first.")) {
      try {
        await deleteStaff(id);
        fetchData();
      } catch (err) {
        if (err.response?.data?.requiresSalarySettlement) {
          const { pendingCount, pendingTotal } = err.response.data;
          const shouldPay = window.confirm(
            `There are ${pendingCount} pending salary record(s), totaling LKR ${Number(pendingTotal || 0).toLocaleString()}. Mark them as paid and delete this staff member?`
          );
          if (shouldPay) {
            await deleteStaff(id, { settlePending: true });
            fetchData();
          }
        } else {
          alert(err.response?.data?.message || "Delete failed");
        }
      }
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      const newStatus = staff.status === "Active" ? "Inactive" : "Active";
      await updateStaff(staff._id, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleUpdateStaff = async () => {
    if (!validateStaffEdit()) {
      return;
    }
    const oldFrequency = editingStaff.currentPaymentFrequency || "monthly";
    const newFrequency = editingStaff.salaryPaymentFrequency || "monthly";
    if (oldFrequency !== newFrequency && !frequencyConfirmation) {
      setFrequencyConfirmation({
        name: `${editingStaff.firstName} ${editingStaff.lastName}`.trim(),
        oldFrequency,
        newFrequency,
      });
      return;
    }
    try {
      const data = {
        firstName: editingStaff.firstName,
        lastName: editingStaff.lastName,
        email: editingStaff.email,
        phone: editingStaff.phone || "",
        salonId: editingStaff.salon,
        status: editingStaff.status,
        salaryPaymentFrequency: editingStaff.salaryPaymentFrequency,
        salaryPaymentCountPerDay: editingStaff.salaryPaymentCountPerDay,
        services: editingStaff.services || []
      };

      if (editingStaff.password) {
        data.password = editingStaff.password;
        data.forcePasswordChange = editingStaff.forcePasswordChange === true;
      }
      if (editingStaff.picture) {
        data.image = editingStaff.picture;
      }

      await updateStaff(editingStaff.id, data);
      setEditModalOpen(false);
      setEditingStaff(null);
      fetchData();
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      setEditError(err.response?.data?.message || "Failed to update staff");
      const message = err.response?.data?.message || "Failed to update staff";
      if (/email/i.test(message)) setEditEmailSubmitError(message);
      else setEditError(message);
    }
  };

  const confirmFrequencyChange = async () => {
    setFrequencyConfirmation(null);
    await handleUpdateStaff();
  };

  const isManagerRole = (role) => {
    const r = String(role || "").trim().toLowerCase();
    return r === "manager" || r === "branch manager";
  };

  const filteredStaff = staffList.filter((s) => {
    const staffName = s.name || s.full_name || "";
    const matchesSearch = staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All Roles" || s.role === selectedRole;
    const salonName = s.salon_id?.name || "";
    const matchesSalon = selectedSalon === "All Salons" || salonName === selectedSalon;

    return matchesSearch && matchesRole && matchesSalon;
  });

  const branchManagers = useMemo(
    () => filteredStaff.filter((s) => isManagerRole(s.role)),
    [filteredStaff]
  );

  const regularStaff = useMemo(
    () => filteredStaff.filter((s) => !isManagerRole(s.role)),
    [filteredStaff]
  );

  const getSalonStaffCount = (salonId) => {
    if (!salonId) return 0;
    const targetId = typeof salonId === "object" ? salonId._id : salonId;
    return staffList.filter((s) => {
      const staffSalonId = typeof s.salon_id === "object" ? s.salon_id?._id : s.salon_id;
      return String(staffSalonId) === String(targetId) && !isManagerRole(s.role);
    }).length;
  };

  const activeCount = filteredStaff.filter((s) => s.status === "Active").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Management" subtitle="Overview and management of all salon personnel" backTo="/superAdminDashboard">
        <Button variant="primary" icon={Plus} onClick={() => navigate("/AddStaff")}>
          Add Staff Member
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
      {!loading && staffList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-neutral-400">Total Personnel:</span>
            <span className="text-sm font-black text-white">{filteredStaff.length}</span>
          </div>
          <div className="bg-surface border border-amber-400/40 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">Branch Managers:</span>
            <span className="text-sm font-black text-amber-400">{branchManagers.length}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-neutral-400">Staff &amp; Stylists:</span>
            <span className="text-sm font-black text-white">{regularStaff.length}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-neutral-400">Active:</span>
            <span className="text-sm font-black text-emerald-400">{activeCount}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <XCircle className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-semibold text-neutral-400">Inactive:</span>
            <span className="text-sm font-black text-neutral-400">{filteredStaff.length - activeCount}</span>
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
              placeholder="Search staff by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 font-medium"
            />
          </div>

          {/* Role Select */}
          <div className="relative">
            <select
              className="appearance-none bg-surface border border-border rounded-xl px-4 pr-9 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-amber-400 uppercase tracking-wider"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option>All Roles</option>
              {Array.from(new Set(staffList.map((s) => s.role).filter(Boolean))).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>

          {/* Salon Select */}
          <div className="relative">
            <select
              className="appearance-none bg-surface border border-border rounded-xl px-4 pr-9 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-amber-400 uppercase tracking-wider"
              value={selectedSalon}
              onChange={(e) => setSelectedSalon(e.target.value)}
            >
              <option>All Salons</option>
              {salons.map((s) => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Layout View Mode Switcher */}
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

      {/* Staff Display Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStaffCard key={i} />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          title="No staff members found"
          description="No staff members match your search filters."
          icon={Users}
          actionLabel="Add Staff Member"
          onAction={() => navigate("/AddStaff")}
        />
      ) : viewMode === "grid" ? (
        <div className="space-y-8">
          {/* ── Section 1: Branch Managers ── */}
          {branchManagers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/25 to-yellow-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm">
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      Branch {branchManagers.length === 1 ? "Manager" : "Managers"}
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-2xs font-extrabold">
                        {branchManagers.length}
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-400">
                      {selectedSalon !== "All Salons"
                        ? `Branch manager overseeing ${selectedSalon} salon operations and staff`
                        : "Appointed leadership overseeing branch operations, personnel, and daily performance"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {branchManagers.map((bm, i) => (
                  <BranchManagerCard
                    key={bm._id}
                    manager={bm}
                    index={i}
                    totalSalonStaff={getSalonStaffCount(bm.salon_id?._id || bm.salon_id || bm.salon)}
                    onViewDetails={() => setSelectedManagerDetails(bm)}
                    onEdit={() => handleEdit(bm)}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    onMarkUnavailable={setUnavailableStaff}
                  />
                ))}
              </div>
            </div>
          ) : selectedSalon !== "All Salons" && (selectedRole === "All Roles" || isManagerRole(selectedRole)) ? (
            <div className="p-5 rounded-2xl bg-surface border border-dashed border-amber-400/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No Branch Manager Assigned</h3>
                  <p className="text-xs text-neutral-400">
                    There is currently no branch manager assigned to <span className="text-amber-400 font-semibold">{selectedSalon}</span>.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => navigate("/AddStaff")}
              >
                Assign Manager
              </Button>
            </div>
          ) : null}

          {/* ── Section 2: Salon Staff & Stylists ── */}
          {(selectedRole === "All Roles" || !isManagerRole(selectedRole)) && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-neutral-300 shadow-sm">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      Salon Staff &amp; Stylists
                      <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-neutral-300 text-2xs font-extrabold">
                        {regularStaff.length}
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Stylists, beauticians, and service providers delivering salon treatments
                    </p>
                  </div>
                </div>
              </div>

              {regularStaff.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surface border border-border text-center">
                  <Users className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No stylists found</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    No regular salon staff members match your current filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {regularStaff.map((s, i) => (
                    <StaffCard
                      key={s._id}
                      staff={s}
                      index={i}
                      onEdit={() => handleEdit(s)}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                      onMarkUnavailable={setUnavailableStaff}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <Table>
          <Table.Head>
            <Table.Th>Staff Member</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Salon Location</Table.Th>
            <Table.Th>Assigned Services</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th align="right">Actions</Table.Th>
          </Table.Head>
          <Table.Body>
            {filteredStaff.map((s) => {
              const salonName = s.salon_id?.name || s.salonName || "Unassigned";
              const isActive = s.status === "Active";
              const servicesCount = s.services?.length || 0;
              const isManager = isManagerRole(s.role);

              return (
                <tr
                  key={s._id}
                  className={clsx(
                    "transition-colors",
                    isManager
                      ? "bg-amber-400/[0.04] hover:bg-amber-400/[0.08]"
                      : "hover:bg-surface-2/60"
                  )}
                >
                  <Table.Td bold className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs",
                        isManager
                          ? "bg-amber-400/20 border border-amber-400/50 text-amber-400 shadow-sm"
                          : "bg-surface-2 border border-border text-neutral-300"
                      )}
                    >
                      {(s.name || s.full_name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-extrabold text-sm">{s.name || s.full_name}</p>
                        {isManager && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" title="Branch Manager" />
                        )}
                      </div>
                      <p className="text-2xs text-neutral-400">{s.email || "No email"}</p>
                    </div>
                  </Table.Td>
                  <Table.Td className="text-xs">
                    {isManager ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 font-extrabold text-2xs uppercase tracking-wider">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Branch Manager
                      </span>
                    ) : (
                      <span className="text-neutral-300 font-semibold">{s.role || "Stylist"}</span>
                    )}
                  </Table.Td>
                  <Table.Td className="text-neutral-300 text-xs">{salonName}</Table.Td>
                  <Table.Td className="text-xs text-neutral-400">
                    {isManager ? (
                      <span className="text-amber-400/90 font-medium">Branch Administration</span>
                    ) : (
                      `${servicesCount} Services Assigned`
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant={isActive ? "success" : "neutral"} dot>
                      {s.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      {isManager && (
                        <button
                          onClick={() => setSelectedManagerDetails(s)}
                          className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border border-amber-400/25 transition-colors"
                          title="View Manager Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-1.5 rounded-lg bg-surface-2 text-info hover:bg-info/20 transition-colors"
                        title="Edit Staff"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="p-1.5 rounded-lg bg-surface-2 text-danger hover:bg-danger/20 transition-colors"
                        title="Delete Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Table.Td>
                </tr>
              );
            })}
          </Table.Body>
        </Table>
      )}

      {/* Edit Staff Modal */}
      <Modal
        isOpen={editModalOpen && !!editingStaff}
        onClose={() => setEditModalOpen(false)}
        title="✏️ Edit Staff Member"
        maxWidth="max-w-xl"
      >
        {editingStaff && (
          <div className="space-y-4 pt-1">
            {editError && (
              <div className="px-4 py-3 rounded-lg bg-danger-dim border border-danger-border text-sm text-danger font-semibold">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  type="text"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                  value={editingStaff.firstName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                  value={editingStaff.lastName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                  value={editingStaff.email}
                  onChange={(e) => { setEditEmailSubmitError(""); setEditingStaff({ ...editingStaff, email: e.target.value }); }}
                  onBlur={() => handleEditBlur("email")}
                  aria-invalid={Boolean(editErrors.email || editEmailSubmitError)}
                />
                  {(editErrors.email || editEmailSubmitError) && <p className="mt-1 text-xs text-danger">{editErrors.email || editEmailSubmitError}</p>}
                  {!editErrors.email && !editEmailSubmitError && fieldMessages.email && <p className="mt-1 text-xs text-muted-2 font-medium">{fieldMessages.email}</p>}
              </div>
              <div>
                <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="text"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                  value={editingStaff.phone || ""}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  onBlur={() => handleEditBlur("phone")}
                  aria-invalid={Boolean(editErrors.phone)}
                  placeholder="Enter phone number"
                />
                {editErrors.phone && <p className="mt-1 text-xs text-danger">{editErrors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">
                Change Password <span className="text-neutral-500 font-normal lowercase">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type={showEditPassword ? "text" : "password"}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 pr-11 text-sm text-white outline-none focus:border-amber-400"
                  value={editingStaff.password || ""}
                  onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                  onBlur={() => handleEditBlur("password")}
                  aria-invalid={Boolean(editErrors.password)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                {editingStaff.password && <button
                  type="button"
                  onClick={() => setShowEditPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition-colors"
                  aria-label={showEditPassword ? "Hide password" : "Show password"}
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>}
              </div>
              {editErrors.password && <p className="mt-1 text-xs text-danger">{editErrors.password}</p>}
              {editingStaff.password && (
                <label className="mt-3 flex items-start gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingStaff.forcePasswordChange === true}
                    onChange={(e) => setEditingStaff({ ...editingStaff, forcePasswordChange: e.target.checked })}
                    className="mt-0.5 accent-amber-400"
                  />
                  Require this account holder to choose a new password at their next login.
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Payment Frequency</label>
                <select
                  value={editingStaff.salaryPaymentFrequency}
                  onChange={(e) => setEditingStaff({ ...editingStaff, salaryPaymentFrequency: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Daily Salary (LKR)</label>
                <input
                  type="number"
                  min="1"
                  value={editingStaff.salaryPaymentCountPerDay}
                  onChange={(e) => setEditingStaff({ ...editingStaff, salaryPaymentCountPerDay: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Assigned Salon</label>
              <select
                value={editingStaff.salon}
                onChange={(e) => handleEditSalonChange(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              >
                <option value="">Select Salon</option>
                {salons.map((salon) => (
                  <option key={salon._id} value={salon._id}>{salon.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Assigned Services</label>
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                {!editingStaff.salon ? (
                  <p className="text-xs text-neutral-400">Select a salon first to view services.</p>
                ) : servicesLoading ? (
                  <p className="text-xs text-neutral-400">Loading salon services...</p>
                ) : services.length === 0 ? (
                  <p className="text-xs text-neutral-400">No services available for this salon.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {services.map((service) => (
                      <label
                        key={service._id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-white cursor-pointer hover:border-amber-400/40"
                      >
                        <input
                          type="checkbox"
                          checked={editingStaff.services.includes(service._id)}
                          onChange={() => handleEditServiceToggle(service._id)}
                          className="h-3.5 w-3.5 accent-amber-400"
                        />
                        <span className="truncate">{service.service_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">Profile Picture</label>
              {editingStaff.currentImage && (
                <img
                  src={mediaUrl(editingStaff.currentImage)}
                  alt="Current staff profile"
                  className="mb-2 h-16 w-16 rounded-xl object-cover border border-border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditingStaff({ ...editingStaff, picture: e.target.files[0] })}
                className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-black file:cursor-pointer"
              />
            </div>
          </div>
        )}

        <Modal.Actions>
          <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleUpdateStaff} disabled={!staffEditIsValid}>
            Save Changes
          </Button>
        </Modal.Actions>
      </Modal>

      <Modal
        isOpen={Boolean(frequencyConfirmation)}
        onClose={() => setFrequencyConfirmation(null)}
        title="Confirm Payment Frequency Change"
        maxWidth="max-w-md"
      >
        {frequencyConfirmation && (
          <div className="space-y-4">
            <p className="text-sm text-muted-1">
              You are changing <strong className="text-white">{frequencyConfirmation.name}</strong>'s payment frequency from <strong className="text-white">{frequencyConfirmation.oldFrequency}</strong> to <strong className="text-white">{frequencyConfirmation.newFrequency}</strong>.
            </p>
            <p className="text-sm text-muted-1">
              This will mark all pending salary under the current frequency as <strong className="text-white">Paid up to today ({new Date().toLocaleDateString()})</strong>.
            </p>
            <p className="text-sm text-muted-1">Do you want to continue?</p>
            <Modal.Actions className="justify-end">
              <Button variant="ghost" onClick={() => setFrequencyConfirmation(null)}>Cancel</Button>
              <Button variant="primary" onClick={confirmFrequencyChange}>Pay &amp; Update Frequency</Button>
            </Modal.Actions>
          </div>
        )}
      </Modal>

      <StaffUnavailableModal
        staff={unavailableStaff}
        onClose={() => setUnavailableStaff(null)}
        onSuccess={() => {
          setUnavailableStaff(null);
          fetchData();
        }}
      />

      {/* Branch Manager Details Modal */}
      <BranchManagerDetailsModal
        manager={selectedManagerDetails}
        totalSalonStaff={
          selectedManagerDetails
            ? getSalonStaffCount(
                selectedManagerDetails.salon_id?._id ||
                  selectedManagerDetails.salon_id ||
                  selectedManagerDetails.salon
              )
            : 0
        }
        isOpen={Boolean(selectedManagerDetails)}
        onClose={() => setSelectedManagerDetails(null)}
        onEdit={(mgr) => {
          setSelectedManagerDetails(null);
          handleEdit(mgr);
        }}
      />
    </div>
  );
};

export default Staff;
