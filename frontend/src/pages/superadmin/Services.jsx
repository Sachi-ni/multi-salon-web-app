import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../../services/serviceService";
import { getSalons } from "../../services/salonService";
import {
  Plus,
  Search,
  Scissors,
  Clock,
  DollarSign,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import clsx from "clsx";

import { useParams } from "react-router-dom";

/* ─────────── Skeleton Card ─────────── */
const SkeletonServiceCard = () => (
  <div className="bg-surface border border-border rounded-2xl p-5 animate-pulse space-y-4 shadow-card">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-surface-2" />
        <div className="h-3 w-20 rounded bg-surface-2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full rounded bg-surface-2" />
      <div className="h-3 w-3/4 rounded bg-surface-2" />
    </div>
    <div className="pt-3 border-t border-border flex justify-between">
      <div className="h-6 w-20 rounded bg-surface-2" />
      <div className="h-6 w-16 rounded bg-surface-2" />
    </div>
  </div>
);

/* ─────────── Actions Menu ─────────── */
const ActionsMenu = ({ onEdit, onDelete }) => {
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-muted-2 hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5 text-info" />
              Edit Service
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2.5 transition-colors duration-150 hover:bg-danger-dim text-danger"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Service
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────── Service Card ─────────── */
const ServiceCard = ({ service, index, onEdit, onDelete }) => {
  const salonName = service.salon_id?.name || "Unknown Salon";

  const formatDuration = (mins) => {
    if (!mins) return "0 mins";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} mins`;
    if (h > 0) return `${h} hr`;
    return `${m} mins`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-amber-400/40 hover:-translate-y-1 hover:shadow-card-hover flex flex-col justify-between"
    >
      <div>
        {/* Top Accent Line */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        <div className="p-5">
          {/* Header Row */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0 group-hover:border-amber-400/50 transition-colors duration-200 text-amber-400">
              <Scissors className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-white leading-tight truncate group-hover:text-amber-400 transition-colors">
                {service.service_name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate font-medium">{salonName}</span>
              </div>
            </div>

            <ActionsMenu
              onEdit={() => onEdit(service)}
              onDelete={() => onDelete(service._id)}
            />
          </div>

          {/* Description */}
          {service.description && (
            <p className="text-xs text-neutral-400 leading-relaxed mb-4 line-clamp-2 font-normal">
              {service.description}
            </p>
          )}

          {/* Details */}
          <div className="flex items-center gap-4 text-xs mb-2">
            <div className="flex items-center gap-1.5 bg-surface-2/60 px-3 py-1.5 rounded-lg border border-border">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white font-bold">{formatDuration(service.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Price */}
      <div className="px-5 py-3.5 bg-surface-2/30 border-t border-border flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-[0.65rem] font-extrabold text-neutral-400 uppercase">LKR</span>
          <span className="text-base font-black text-amber-400">
            {Number(service.base_price).toLocaleString()}
          </span>
        </div>
        <Badge variant="success" dot={true}>
          Active
        </Badge>
      </div>
    </motion.div>
  );
};

/* ─────────── Service Form (for Add/Edit modal) ─────────── */
const ServiceForm = ({
  formData,
  setFormData,
  salons,
}) => {
  return (
    <div className="space-y-4 pt-1">
      {/* Salon */}
      <div>
        <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">
          Salon Branch <span className="text-amber-400/80 lowercase font-medium ml-1">(required)</span>
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none bg-surface-2 border border-border rounded-xl px-4 pr-9 py-2.5 text-sm text-white outline-none cursor-pointer transition-all duration-200 focus:border-amber-400 font-medium"
            style={{ colorScheme: "dark" }}
            value={formData.salon_id}
            onChange={(e) =>
              setFormData({ ...formData, salon_id: e.target.value })
            }
            required
          >
            <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Select a salon branch</option>
            {salons.map((s) => (
              <option key={s._id} value={s._id} style={{ background: "#1a1a2e", color: "#fff" }}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Service Name */}
      <div>
        <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">
          Service Title <span className="text-amber-400/80 lowercase font-medium ml-1">(required)</span>
        </label>
        <input
          type="text"
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 font-medium"
          placeholder="e.g. Haircut & Styling, Deluxe Facial"
          value={formData.service_name}
          onChange={(e) =>
            setFormData({ ...formData, service_name: e.target.value })
          }
          autoComplete="off"
          required
        />
      </div>

      {/* Price + Duration Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">
            Base Price (LKR) <span className="text-amber-400/80 lowercase font-medium ml-1">(required)</span>
          </label>
          <input
            type="number"
            min="0"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 font-medium"
            placeholder="0.00"
            value={formData.base_price}
            onChange={(e) =>
              setFormData({ ...formData, base_price: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">
            Duration (Minutes) <span className="text-amber-400/80 lowercase font-medium ml-1">(required)</span>
          </label>
          <input
            type="number"
            min="1"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 font-medium"
            placeholder="60"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-2xs font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5">
          Description <span className="text-neutral-500 lowercase font-medium ml-1">(optional)</span>
        </label>
        <textarea
          rows={3}
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 resize-none font-medium"
          placeholder="Detailed description of what's included in this service..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          autoComplete="off"
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   ══  MAIN SERVICES PAGE  ═══════════════════
   ═══════════════════════════════════════════ */
const Services = () => {
  const [servicesList, setServicesList] = useState([]);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSalon, setSelectedSalon] = useState("All Salons");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = useMemo(() => ({
    service_name: "",
    base_price: "",
    duration: "",
    description: "",
    salon_id: "",
  }), []);
  const [formData, setFormData] = useState(emptyForm);

  const { salonId } = useParams();

  useEffect(() => {
    if (salonId) {
      setEditingService(null);
      setFormData({ ...emptyForm, salon_id: salonId });
      setModalOpen(true);
    }
  }, [salonId, emptyForm]);

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [servicesRes, salonsRes] = await Promise.allSettled([
        getServices(),
        getSalons(),
      ]);
      setServicesList(
        servicesRes.status === "fulfilled" ? servicesRes.value.data || [] : []
      );
      setSalons(
        salonsRes.status === "fulfilled" ? salonsRes.value.data || [] : []
      );
    } catch (err) {
      setError("Failed to load services data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Handlers ── */
  const openAddModal = () => {
    setEditingService(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name || "",
      base_price: service.base_price || "",
      duration: service.duration || "",
      description: service.description || "",
      salon_id:
        (typeof service.salon_id === "object"
          ? service.salon_id?._id
          : service.salon_id) || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (
      !formData.service_name ||
      !formData.base_price ||
      !formData.duration ||
      !formData.salon_id
    ) {
      setError("Please fill all required fields (Name, Price, Duration, Salon)");
      return;
    }
    
    if (Number(formData.base_price) < 0) {
      setError("Price cannot be a negative value.");
      return;
    }
    
    if (Number(formData.duration) <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        service_name: formData.service_name,
        base_price: Number(formData.base_price),
        duration: Number(formData.duration),
        description: formData.description,
        salon_id: formData.salon_id,
      };

      if (editingService) {
        await updateService(editingService._id, payload);
      } else {
        await createService(payload);
      }

      setModalOpen(false);
      setFormData(emptyForm);
      setEditingService(null);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${editingService ? "update" : "create"} service`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
      setServicesList((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Failed to delete service");
    }
  };

  /* ── Filtering ── */
  const filteredServices = servicesList.filter((s) => {
    const matchesSearch = (s.service_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const salonName =
      typeof s.salon_id === "object" ? s.salon_id?.name : "";
    const matchesSalon =
      selectedSalon === "All Salons" || salonName === selectedSalon;

    return matchesSearch && matchesSalon;
  });

  /* ── Stats ── */
  const totalServices = filteredServices.length;
  const avgPrice =
    totalServices > 0
      ? Math.round(
          filteredServices.reduce((sum, s) => sum + (s.base_price || 0), 0) /
            totalServices
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salon Services"
        subtitle="Catalog of all available services across salon locations"
        backTo="/superAdminDashboard"
      >
        <Button variant="primary" icon={Plus} onClick={openAddModal}>
          Add New Service
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-dim border border-danger-border text-sm text-danger">
          <span className="flex-1 font-semibold">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-danger hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && servicesList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-neutral-400">Total Services:</span>
            <span className="text-sm font-black text-white">{totalServices}</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-neutral-400">Avg. Base Price:</span>
            <span className="text-sm font-black text-emerald-400">
              LKR {avgPrice.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              placeholder="Search service by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 font-medium"
            />
          </div>
          <div className="relative">
            <select
              className="appearance-none bg-surface border border-border rounded-xl px-4 pr-9 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-amber-400 uppercase tracking-wider"
              value={selectedSalon}
              onChange={(e) => setSelectedSalon(e.target.value)}
            >
              <option>All Salons</option>
              {salons.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* View Switcher */}
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

      {/* Services Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonServiceCard key={i} />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="No services found"
          description="No services match your search filters."
          icon={Scissors}
          actionLabel="Add New Service"
          onAction={openAddModal}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredServices.map((s, i) => (
            <ServiceCard
              key={s._id}
              service={s}
              index={i}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Table>
          <Table.Head>
            <Table.Th>Service Name</Table.Th>
            <Table.Th>Salon Branch</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th align="right">Base Price</Table.Th>
            <Table.Th align="right">Actions</Table.Th>
          </Table.Head>
          <Table.Body>
            {filteredServices.map((s) => {
              const salonName = typeof s.salon_id === "object" ? s.salon_id?.name : "Salon";
              return (
                <tr key={s._id} className="hover:bg-surface-2/60 transition-colors">
                  <Table.Td bold className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-extrabold text-sm">{s.service_name}</p>
                      {s.description && <p className="text-2xs text-neutral-400 line-clamp-1">{s.description}</p>}
                    </div>
                  </Table.Td>
                  <Table.Td className="text-neutral-300 text-xs">{salonName}</Table.Td>
                  <Table.Td className="text-xs text-neutral-400">{s.duration} mins</Table.Td>
                  <Table.Td align="right" className="text-amber-400 font-extrabold text-xs">
                    LKR {Number(s.base_price).toLocaleString()}
                  </Table.Td>
                  <Table.Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg bg-surface-2 text-info hover:bg-info/20 transition-colors"
                        title="Edit Service"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="p-1.5 rounded-lg bg-surface-2 text-danger hover:bg-danger/20 transition-colors"
                        title="Delete Service"
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

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingService(null);
          setFormData(emptyForm);
        }}
        title={editingService ? "✏️ Edit Service Details" : "✨ Add New Service"}
        maxWidth="max-w-xl"
      >
        <ServiceForm
          formData={formData}
          setFormData={setFormData}
          salons={salons}
        />
        <Modal.Actions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setModalOpen(false);
              setEditingService(null);
              setFormData(emptyForm);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {editingService ? "Update Service" : "Create Service"}
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export default Services;
