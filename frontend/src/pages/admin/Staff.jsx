import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStaff, deleteStaff, updateStaff } from "../../services/staffService";
import { getServices } from "../../services/serviceService";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";

import {
  Plus,
  Search,
  Users,
  Star,
  MapPin,
  MoreVertical,
  Power,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://localhost:5000";

const buildImageUrl = (image) => {
  if (!image) return null;

  const normalized = image.replace(/\\/g, "/");

  if (normalized.startsWith("http")) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return `${API_BASE}${normalized}`;
  }

  return `${API_BASE}/${normalized}`;
};

/* ── Actions Menu ── */
const ActionsMenu = ({
  staff,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-surface-2 hover:text-white transition-all duration-150"
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
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(staff);
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-neutral-300 hover:text-white"
            >
              <Power className="w-3.5 h-3.5" />
              {staff.status === "Active"
                ? "Deactivate Staff"
                : "Activate Staff"}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-neutral-300 hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5 text-info" />
              Edit Details
            </button>

            <div className="my-1 border-t border-border" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(staff._id);
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-danger-dim text-danger"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Staff
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Staff Card Component ── */
const StaffCard = ({
  staff,
  index,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const isInactive = staff.status === "Inactive";

  const maxVisible = 3;
  const visibleServices =
    staff.services?.slice(0, maxVisible) || [];
  const hiddenServices =
    staff.services?.slice(maxVisible) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.3,
      }}
      className={clsx(
        "group relative bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-amber-400/40 hover:-translate-y-1 hover:shadow-card-hover flex flex-col justify-between",
        isInactive && "opacity-70"
      )}
    >
      <div>
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        <div className="p-5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3.5 min-w-0">

              {/* Staff Image */}
              <div className="relative flex-shrink-0">
                {buildImageUrl(staff.image) ? (
                  <img
                    src={buildImageUrl(staff.image)}
                    alt={staff.full_name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/30 group-hover:border-amber-400 transition-colors"
                    onError={(e) => {
                      e.target.style.display = "none";

                      const fallback =
                        e.currentTarget.nextElementSibling;

                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                ) : null}

                <div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black items-center justify-center text-lg shadow-sm"
                  style={{
                    display: buildImageUrl(staff.image)
                      ? "none"
                      : "flex",
                  }}
                >
                  {staff.full_name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <span
                  className={clsx(
                    "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface",
                    isInactive
                      ? "bg-neutral-500"
                      : "bg-emerald-500"
                  )}
                  title={staff.status}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-white truncate leading-tight group-hover:text-amber-400 transition-colors">
                  {staff.full_name}
                </h3>

                <p className="text-xs font-semibold text-amber-400 mt-0.5 truncate">
                  {staff.specification ||
                    staff.role ||
                    "Stylist"}
                </p>

                <p className="text-2xs text-neutral-400 mt-0.5 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                  {staff.salon_id?.name ||
                    "Salon Branch"}
                </p>
              </div>
            </div>

            <ActionsMenu
              staff={staff}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          </div>

          {/* Salary Rate */}
          <div className="bg-surface-2/60 border border-border/70 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Daily Rate:
            </span>

            <span className="text-white font-extrabold">
              LKR{" "}
              {(
                staff.salary_payment_count_per_day || 0
              ).toLocaleString()}{" "}
              / day
            </span>
          </div>

          {/* Staff Rating */}
          <div className="bg-surface-2/60 border border-border/70 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Staff Rating:
            </span>

            <span className="text-white font-extrabold flex items-center gap-1.5">
              <span className="text-amber-400">
                {staff.rating || "0.0"}
              </span>

              <span className="text-neutral-400 font-medium">
                / 5.0
              </span>

              {staff.ratingCount > 0 && (
                <span className="text-[0.65rem] text-neutral-500 font-medium">
                  ({staff.ratingCount})
                </span>
              )}
            </span>
          </div>

          {/* Assigned Services */}
          <div className="space-y-1.5">
            <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-wider block">
              Assigned Services
            </span>

            <div className="flex flex-wrap gap-1.5 items-center">
              {visibleServices.length > 0 ? (
                visibleServices.map((svc) => (
                  <span
                    key={svc._id}
                    className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-2xs font-bold text-neutral-200"
                  >
                    {svc.service_name}
                  </span>
                ))
              ) : (
                <span className="text-2xs text-neutral-500 italic">
                  No services assigned
                </span>
              )}

              {hiddenServices.length > 0 && (
                <div className="relative group/tooltip">
                  <span className="px-2 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-2xs font-extrabold cursor-pointer">
                    +{hiddenServices.length} more
                  </span>

                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-48 p-2 bg-surface-2 border border-border rounded-xl shadow-modal z-50 text-2xs space-y-1">
                    <p className="font-extrabold text-white border-b border-border pb-1 mb-1">
                      Additional Services:
                    </p>

                    {hiddenServices.map((s) => (
                      <p
                        key={s._id}
                        className="text-neutral-300 truncate"
                      >
                        • {s.service_name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main Admin Staff Page ── */
export default function AdminStaffPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { salonId: routeSalonId } = useParams();

  const salonId =
    routeSalonId || user?.salon_id || "";

  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const [editStaff, setEditStaff] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStaffData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [staffRes, svcRes] = await Promise.all([
        getStaff(salonId),
        getServices(salonId),
      ]);

      // Hide manager/staff-admin accounts from this Salon Staff page only
    const salonStaff = (staffRes.data || []).filter((staff) => {
      const role = (staff.role || "").toLowerCase().trim();

      return (
        role !== "manager" &&
        role !== "staff-admin" &&
        role !== "staff admin"
      );
    });

    setStaffList(salonStaff);
    setServicesList(svcRes.data || []);
    
    } catch (err) {
      console.error(err);
      setError("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleToggleStatus = async (staff) => {
    try {
      const newStatus =
        staff.status === "Active"
          ? "Inactive"
          : "Active";

      await updateStaff(staff._id, {
        status: newStatus,
      });

      fetchStaffData();
    } catch (err) {
      console.error(err);
      setError("Failed to update staff status");
    }
  };

  const handleEditOpen = (staff) => {
    setEditStaff(staff);

    setEditForm({
      firstName:
        staff.first_name ||
        staff.full_name?.split(" ")[0] ||
        "",

      lastName:
        staff.last_name ||
        staff.full_name?.split(" ").slice(1).join(" ") ||
        "",

      email: staff.email || "",

      paymentFrequency:
        staff.salary_payment_frequency || "monthly",

      salaryPerDay:
        staff.salary_payment_count_per_day || 0,

      services:
        staff.services?.map((s) => s._id) || [],
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    setEditLoading(true);
    setError("");

    try {
      const updateData = {
        firstName: editForm.firstName || "",
        lastName: editForm.lastName || "",
        email: editForm.email || "",

        salaryPaymentFrequency:
          editForm.paymentFrequency || "monthly",

        salaryPaymentCountPerDay:
          Number(editForm.salaryPerDay) || 0,

        // IMPORTANT
        services: Array.isArray(editForm.services)
          ? editForm.services
          : [],
      };

      console.log("UPDATING STAFF:", updateData);
      console.log("SERVICES BEING SENT:", updateData.services);

      const response = await updateStaff(
        editStaff._id,
        updateData
      );

      console.log("UPDATED STAFF RESPONSE:", response.data);
      console.log(
        "UPDATED SERVICES:",
        response.data?.services
      );

      setEditStaff(null);

      // Reload staff from database
      await fetchStaffData();

    } catch (err) {
      console.error("UPDATE STAFF ERROR:", err);

      console.error(
        "SERVER RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Failed to update staff"
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      await deleteStaff(deleteId);

      setDeleteId(null);

      fetchStaffData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to delete staff member"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    if (!searchTerm) {
      return staffList;
    }

    const term = searchTerm.toLowerCase();

    return staffList.filter((s) => {
      const name =
        (s.full_name || "").toLowerCase();

      const spec =
        (s.specification || "").toLowerCase();

      const email =
        (s.email || "").toLowerCase();

      const phone =
        (s.phone || "").toLowerCase();

      return (
        name.includes(term) ||
        spec.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    });
  }, [staffList, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Team Directory"
        subtitle="Manage stylists, staff schedules, and assigned services"
        backTo={`/salon-admin/${salonId}/adminDashboard`}
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() =>
            navigate(
              `/salon-admin/${salonId}/AddStaff`
            )
          }
        >
          Add Staff Member
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-dim border border-danger-border text-sm text-danger">
          <span className="flex-1 font-semibold">
            {error}
          </span>

          <button
            onClick={() => setError("")}
            className="text-danger hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />

          <input
            placeholder="Search staff by name, specification, or email..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 placeholder:text-neutral-500 font-medium"
          />
        </div>

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
            <span className="hidden sm:inline">
              Grid
            </span>
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
            <span className="hidden sm:inline">
              Table
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 bg-surface border border-border rounded-2xl animate-pulse space-y-4"
            >
              <div className="w-12 h-12 bg-surface-2 rounded-2xl" />
              <div className="h-4 w-32 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          title="No staff members found"
          description="No team members match your search criteria."
          icon={Users}
          actionLabel="Add Staff Member"
          onAction={() =>
            navigate(
              `/salon-admin/${salonId}/AddStaff`
            )
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff, index) => (
            <StaffCard
              key={staff._id}
              staff={staff}
              index={index}
              onEdit={() => handleEditOpen(staff)}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      ) : (
        <Table>
          <Table.Head>
            <Table.Th>Staff Member</Table.Th>
            <Table.Th>Specification</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th align="right">
              Daily Rate
            </Table.Th>
            <Table.Th align="right">
              Actions
            </Table.Th>
          </Table.Head>

          <Table.Body>
            {filteredStaff.map((staff) => (
              <tr
                key={staff._id}
                className="hover:bg-surface-2/60 transition-colors"
              >
                <Table.Td
                  bold
                  className="flex items-center gap-3"
                >
                  {buildImageUrl(staff.image) ? (
                    <img
                      src={buildImageUrl(staff.image)}
                      alt={staff.full_name}
                      className="w-8 h-8 rounded-xl object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                      {staff.full_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div>
                    <span className="text-white font-extrabold text-sm">
                      {staff.full_name}
                    </span>

                    <span className="text-2xs text-neutral-400 block">
                      {staff.email}
                    </span>
                  </div>
                </Table.Td>

                <Table.Td className="text-neutral-300 text-xs font-semibold">
                  {staff.specification ||
                    staff.role ||
                    "Stylist"}
                </Table.Td>

                <Table.Td>
                  <Badge
                    variant={
                      staff.status === "Active"
                        ? "success"
                        : "neutral"
                    }
                    dot={true}
                  >
                    {staff.status}
                  </Badge>
                </Table.Td>

                <Table.Td
                  align="right"
                  className="text-amber-400 font-black text-xs"
                >
                  LKR{" "}
                  {(
                    staff.salary_payment_count_per_day ||
                    0
                  ).toLocaleString()}{" "}
                  / day
                </Table.Td>

                <Table.Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        handleEditOpen(staff)
                      }
                      className="p-1.5 rounded-lg bg-surface-2 text-info hover:bg-info/20 transition-colors"
                      title="Edit Staff"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteId(staff._id)
                      }
                      className="p-1.5 rounded-lg bg-surface-2 text-danger hover:bg-danger/20 transition-colors"
                      title="Delete Staff"
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
      <Modal
        isOpen={!!editStaff}
        onClose={() => setEditStaff(null)}
        title="✏️ Edit Staff Details"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={handleEditSubmit}
          className="space-y-4 pt-1"
        >
          {/* First Name */}
          <Input
            label="First Name"
            value={editForm.firstName || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                firstName: e.target.value,
              })
            }
            required
          />

          {/* Last Name */}
          <Input
            label="Last Name"
            value={editForm.lastName || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                lastName: e.target.value,
              })
            }
            required
          />

          {/* Email */}
          <Input
            label="Email"
            type="email"
            value={editForm.email || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                email: e.target.value,
              })
            }
            required
          />

          {/* Payment Frequency */}
          <div>
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              PAYMENT FREQUENCY 
              <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">
                  (required)
              </span>
            </label>

            <select
              value={editForm.paymentFrequency || "monthly"}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  paymentFrequency: e.target.value,
                }))
              }
              required
              className="
                w-full
                rounded-xl
                border
                border-amber-400/70
                bg-[#171717]
                px-3.5
                py-2.5
                text-sm
                font-medium
                text-white
                outline-none
                transition-all
                duration-200
                focus:border-amber-400
                focus:ring-1
                focus:ring-amber-400/30
              "
            >
              <option value="daily" className="bg-[#1a1a1a] text-white">
                Daily
              </option>
              <option value="weekly" className="bg-[#1a1a1a] text-white">
                Weekly
              </option>
              <option value="monthly" className="bg-[#1a1a1a] text-white">
                Monthly
              </option>
            </select>
          </div>

          {/* Salary Amount Per Day */}
          <Input
            label="Salary Amount Per Day (LKR)"
            type="number"
            min="1"
            value={editForm.salaryPerDay || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                salaryPerDay: Number(e.target.value),
              })
            }
            required
          />

          {/* Services */}
          <div>
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              ASSIGNED SERVICES
              <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">
                (required)
              </span>
            </label>

            <div className="bg-surface border border-border rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
              {servicesList.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  No services available.
                </p>
              ) : (
                servicesList.map((service) => {
                  const selected =
                    Array.isArray(editForm.services) &&
                    editForm.services.includes(service._id);

                  return (
                    <label
                      key={service._id}
                      className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          setEditForm((prev) => {
                            const currentServices = Array.isArray(
                              prev.services
                            )
                              ? prev.services
                              : [];

                            let updatedServices;

                            if (e.target.checked) {
                              // Prevent duplicate service IDs
                              updatedServices =
                                currentServices.includes(service._id)
                                  ? currentServices
                                  : [
                                      ...currentServices,
                                      service._id,
                                    ];
                            } else {
                              updatedServices =
                                currentServices.filter(
                                  (id) => id !== service._id
                                );
                            }

                            console.log(
                              "SELECTED SERVICES:",
                              updatedServices
                            );

                            return {
                              ...prev,
                              services: updatedServices,
                            };
                          });
                        }}
                        className="accent-amber-400"
                      />

                      <span className="text-sm text-neutral-200">
                        {service.service_name}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Selected service count */}
            <p className="text-[0.65rem] text-neutral-500 mt-1.5">
              {editForm.services?.length || 0} service
              {editForm.services?.length === 1 ? "" : "s"} selected
            </p>
          </div>

          <Modal.Actions>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditStaff(null)}
              disabled={editLoading}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              loading={editLoading}
            >
              Save Changes
            </Button>
          </Modal.Actions>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="🗑️ Delete Staff Member?"
        maxWidth="max-w-sm"
      >
        <p className="text-xs text-neutral-300 py-3 text-center leading-relaxed">
          Are you sure you want to delete this staff member?
          This action cannot be undone.
        </p>

        <Modal.Actions className="justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(null)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleteLoading}
          >
            Delete Staff
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}