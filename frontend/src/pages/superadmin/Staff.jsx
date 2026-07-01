import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStaff, deleteStaff, updateStaff } from "../../services/staffService";
import { getSalons } from "../../services/salonService";
import { getServices } from "../../services/serviceService";
import { Plus, Search, Users, Star, MapPin, Briefcase, Calendar, MoreVertical, Power, Pencil, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import clsx from "clsx";

const API_BASE = "http://localhost:5000";

/* ── Skeleton Card ── */
const SkeletonStaffCard = () => (
  <div className="bg-surface border border-border rounded-xl p-5 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-20 h-20 rounded-2xl bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-28 rounded bg-surface-2" />
        <div className="h-3 w-20 rounded bg-surface-2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full rounded bg-surface-2" />
      <div className="h-3 w-3/4 rounded bg-surface-2" />
    </div>
  </div>
);

/* ── Staff Card Actions Menu ── */
const ActionsMenu = ({ staff, onEdit, onToggleStatus, onDelete }) => {
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
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-2 hover:bg-surface-2 hover:text-white transition-all duration-150"
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
            className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-xl shadow-modal py-1.5 z-50"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus(staff); setOpen(false); }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-muted-2 hover:text-white"
            >
              <Power className="w-3.5 h-3.5" />
              {staff.status === "Active" ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-muted-2 hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Staff
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(staff._id); setOpen(false); }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-danger-dim text-danger"
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

/* ── Staff Card Component ── */
const StaffCard = ({ staff, index, onEdit, onToggleStatus, onDelete, }) => {
  const initials = staff.name
    ? staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "S";
  const salonName = staff.salon_id?.name || staff.salonName || "Unassigned";
  const isActive = staff.status === "Active";
  const staffServices = staff.services || [];

  // Build image URL from the uploaded path
  const imageUrl = staff.image
    ? `${API_BASE}/${staff.image.replace(/\\/g, "/")}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group bg-surface border border-border rounded-xl overflow-hidden transition-all duration-250 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(245,200,0,0.06)]"
    >
      {/* Top Accent Line */}
      <div className={clsx(
        "h-[2px] transition-all duration-300",
        isActive
          ? "bg-gradient-to-r from-accent via-accent-hover to-accent"
          : "bg-gradient-to-r from-muted via-muted-2 to-muted"
      )} />

      <div className="p-5">
        {/* Header Row: Avatar + Name + Actions */}
        <div className="flex items-start gap-3.5 mb-4">
          {/* Avatar / Photo */}
          <div className="relative flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={staff.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-border group-hover:border-accent/40 transition-colors duration-200"
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
              />
            ) : null}
            <div
              className={clsx(
                "w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border-2 border-border group-hover:border-accent/40 items-center justify-center text-accent font-black text-2xl transition-colors duration-200",
                imageUrl ? "hidden" : "flex"
              )}
            >
              {initials}
            </div>
            {/* Status Dot */}
            <span
              className={clsx(
                "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-surface",
                isActive ? "bg-success animate-pulse-dot" : "bg-muted"
              )}
            />
          </div>

          {/* Name + Role */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[0.9rem] font-bold text-white leading-tight truncate">
              {staff.full_name}
            </h3>
            <div className="mt-1">
              <Badge variant="info" dot={false}>
                {staff.role}
              </Badge>
            </div>
          </div>

          {/* Actions Menu */}
          <ActionsMenu
            staff={staff}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 mb-4">
          {/* Salon */}
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <span className="text-muted-2 truncate">{salonName}</span>
          </div>
          {/* Bookings */}
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <span className="text-muted-2">
              <span className="text-white font-semibold">{staff.bookings || 0}</span> bookings
            </span>
          </div>
          {/* Status */}
          <div className="flex items-center gap-2 text-xs">
            <Briefcase className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <Badge variant={isActive ? "success" : "warning"} dot>
              {staff.status}
            </Badge>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Briefcase className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
            {staffServices.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {staffServices.map((service) => (
                  <span
                    key={service._id || service}
                    className="px-2 py-1 rounded-md bg-accent-dim border border-accent-muted text-[0.65rem] font-bold text-accent"
                  >
                    {service.service_name || service}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-2">No services assigned</span>
            )}
          </div>
        </div>

        {/* Footer: Rating + Quick Actions */}
        <div className="flex items-center justify-between pt-3.5 border-t border-border">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={clsx(
                    "w-3 h-3",
                    star <= Math.round(parseFloat(staff.rating) || 0)
                      ? "fill-accent text-accent"
                      : "text-border"
                  )}
                />
              ))}
            </div>
            <span className="text-[0.7rem] font-bold text-muted-2">
              {staff.rating || "0.0"}
            </span>
          </div>

          {/* Quick Toggle */}
          <button
            onClick={() => onToggleStatus(staff)}
            className={clsx(
              "px-3 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider transition-all duration-200",
              isActive
                ? "bg-success-dim text-success border border-success-border hover:bg-success/20"
                : "bg-accent-dim text-accent border border-accent-muted hover:bg-accent-muted"
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </button>
        </div>
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const handleEdit = (staff) => {
    const names = (staff.name || "").split(" ");

    // staff.services may be populated objects ({_id, service_name}) or raw ids
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
      salon: staff.salon_id?._id || staff.salon || "",
      services: assignedServices,
      status: staff.status || "Active",
      salaryPaymentFrequency: staff.salary_payment_frequency || "monthly",
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
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      try {
        await deleteStaff(id);
        fetchData();
      } catch (err) {
        alert("Delete failed");
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
    try {
      const data = new FormData();

      data.append(
        "name",
        `${editingStaff.firstName} ${editingStaff.lastName}`
      );

      data.append("email", editingStaff.email);
      data.append("salonId", editingStaff.salon);
      data.append("status", editingStaff.status);
      data.append("salaryPaymentFrequency", editingStaff.salaryPaymentFrequency);
      data.append("salaryPaymentCountPerDay", editingStaff.salaryPaymentCountPerDay);
      if (editingStaff.services.length > 0) {
        editingStaff.services.forEach((serviceId) => {
          data.append("services", serviceId);
        });
      }


      if (editingStaff.picture) {
        data.append("image", editingStaff.picture);
      }

      // DEBUG: Check what is being sent
      for (let pair of data.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await updateStaff(editingStaff.id, data);

      // DEBUG: Check response from backend
      console.log("UPDATE RESPONSE:", res.data);

      setEditModalOpen(false);
      setEditingStaff(null);

      fetchData();

      alert("Staff updated successfully");
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      alert(
        err.response?.data?.message || "Failed to update staff"
      );
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const staffName = s.name || "";

    const matchesSearch =
      staffName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRole === "All Roles" ||
      s.role === selectedRole;

    const salonName = s.salon_id?.name || "";

    const matchesSalon =
      selectedSalon === "All Salons" ||
      salonName === selectedSalon;

    return matchesSearch && matchesRole && matchesSalon;
  });

  const activeCount = filteredStaff.filter((s) => s.status === "Active").length;

  return (
    <div>
      <PageHeader title="Staff" subtitle="All staff across all salons" backTo="/superAdminDashboard">
        <Button variant="primary" icon={Plus} onClick={() => navigate("/AddStaff")}>
          Add Staff
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-muted-2 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && staffList.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-2">Total</span>
            <span className="text-sm font-black text-white">{filteredStaff.length}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-muted-2">Active</span>
            <span className="text-sm font-black text-success">{activeCount}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-muted" />
            <span className="text-xs text-muted-2">Inactive</span>
            <span className="text-sm font-black text-muted-2">{filteredStaff.length - activeCount}</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
          <input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none bg-surface border border-border rounded-xl px-4 pr-9 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-accent uppercase tracking-wider"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option>All Roles</option>
            {Array.from(new Set(staffList.map((s) => s.role))).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-2 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            className="appearance-none bg-surface border border-border rounded-xl px-4 pr-9 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-accent uppercase tracking-wider"
            value={selectedSalon}
            onChange={(e) => setSelectedSalon(e.target.value)}
          >
            <option>All Salons</option>
            {salons.map((s) => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-2 pointer-events-none" />
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStaffCard key={i} />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          title="No staff found"
          description="No staff members match your current filters."
          icon={Users}
          actionLabel="Add Staff"
          onAction={() => navigate("/AddStaff")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStaff.map((s, i) => (
            <StaffCard
              key={s._id}
              staff={s}
              index={i}
              onEdit={() => handleEdit(s)}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit Staff Modal */}
      {editModalOpen && editingStaff && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto">

            <h2 className="text-xl font-bold text-white mb-4">
              Edit Staff
            </h2>

            {/* First Name */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">First Name</label>
              <input
                type="text"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
                value={editingStaff.firstName}
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    firstName: e.target.value,
                  })
                }
              />
            </div>

            {/* Last Name */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">Last Name</label>
              <input
                type="text"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
                value={editingStaff.lastName}
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    lastName: e.target.value,
                  })
                }
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
                value={editingStaff.email}
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    email: e.target.value,
                  })
                }
              />
            </div>

            {/* Salary Payment */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">Salary Payment</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={editingStaff.salaryPaymentFrequency}
                  onChange={(e) => setEditingStaff({ ...editingStaff, salaryPaymentFrequency: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>

                <input
                  type="number"
                  min="1"
                  value={editingStaff.salaryPaymentCountPerDay}
                  onChange={(e) => setEditingStaff({ ...editingStaff, salaryPaymentCountPerDay: e.target.value })}
                  placeholder="Amount of salary per day"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent"
                />
              </div>
            </div>

            {/* Salon */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">Salon</label>
              <select
                value={editingStaff.salon}
                onChange={(e) => handleEditSalonChange(e.target.value)}
                className="w-full p-2 rounded bg-surface-2 text-white"
              >
                <option value="">Select Salon</option>

                {salons.map((salon) => (
                  <option key={salon._id} value={salon._id}>
                    {salon.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Services */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">Services</label>
              <div className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3">
                {!editingStaff.salon ? (
                  <p className="text-xs text-muted-2">Select a salon to choose services.</p>
                ) : servicesLoading ? (
                  <p className="text-xs text-muted-2">Loading services...</p>
                ) : services.length === 0 ? (
                  <p className="text-xs text-muted-2">No services found for this salon.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {services.map((service) => (
                      <label
                        key={service._id}
                        className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2 text-sm text-white cursor-pointer hover:border-accent/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={editingStaff.services.includes(service._id)}
                          onChange={() => handleEditServiceToggle(service._id)}
                          className="h-4 w-4 accent-yellow-400"
                        />
                        <span className="truncate">{service.service_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={editingStaff.status}
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    status: e.target.value,
                  })
                }
                className="w-full p-2 rounded bg-surface-2 text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Current Image */}
            {editingStaff.currentImage && (
              <div className="mb-3">
                <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">
                  Current Image
                </label>

                <img
                  src={`${API_BASE}/${editingStaff.currentImage}`}
                  alt="staff"
                  className="w-24 h-24 rounded-lg object-cover border"
                />
              </div>
            )}

            {/* Upload New Image */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">
                Change Profile Picture
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    picture: e.target.files[0],
                  })
                }
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-accent file:text-primary file:cursor-pointer"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateStaff}
                className="px-4 py-2 rounded bg-accent text-black font-semibold"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Staff;
