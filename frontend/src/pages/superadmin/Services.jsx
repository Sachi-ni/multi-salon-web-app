import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import clsx from "clsx";
import { useParams } from "react-router-dom";

/* ─────────── Skeleton Card ─────────── */
const SkeletonServiceCard = () => (
  <div className="bg-surface border border-border rounded-xl p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-xl bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-surface-2" />
        <div className="h-3 w-20 rounded bg-surface-2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full rounded bg-surface-2" />
      <div className="h-3 w-3/4 rounded bg-surface-2" />
    </div>
    <div className="mt-4 pt-3 border-t border-border flex gap-3">
      <div className="h-6 w-16 rounded bg-surface-2" />
      <div className="h-6 w-20 rounded bg-surface-2" />
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
            className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-xl shadow-modal py-1.5 z-50"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-white/[0.04] text-muted-2 hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Service
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors duration-150 hover:bg-danger-dim text-danger"
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group bg-surface border border-border rounded-xl overflow-hidden transition-all duration-250 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(245,200,0,0.06)]"
    >
      {/* Top Accent Line */}
      <div className="h-[2px] bg-gradient-to-r from-accent via-accent-hover to-accent" />

      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start gap-3.5 mb-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors duration-200">
            <Scissors className="w-5 h-5 text-accent" />
          </div>

          {/* Name + Salon */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[0.9rem] font-bold text-white leading-tight truncate">
              {service.service_name}
            </h3>
            <div className="mt-1">
              <Badge variant="info" dot={false}>
                {salonName}
              </Badge>
            </div>
          </div>

          {/* Actions Menu */}
          <ActionsMenu
            onEdit={() => onEdit(service)}
            onDelete={() => onDelete(service._id)}
          />
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-xs text-muted-2 leading-relaxed mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <span className="text-muted-2 truncate">{salonName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <span className="text-muted-2">
              <span className="text-white font-semibold">
                {service.duration}
              </span>{" "}
              minutes
            </span>
          </div>
        </div>

        {/* Footer: Price */}
        <div className="flex items-center justify-between pt-3.5 border-t border-border">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-accent" />
            <span className="text-sm font-black text-white">
              Rs. {Number(service.base_price).toLocaleString()}
            </span>
          </div>
          <Badge variant="success" dot>
            Active
          </Badge>
        </div>
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
    <div className="space-y-4">
      {/* Salon */}
      <div>
        <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">
          Salon <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none bg-surface-2 border border-border rounded-xl px-4 pr-9 py-2.5 text-sm text-white outline-none cursor-pointer transition-all duration-200 focus:border-accent"
            style={{ colorScheme: "dark" }}
            value={formData.salon_id}
            onChange={(e) =>
              setFormData({ ...formData, salon_id: e.target.value })
            }
            required
          >
            <option value="" style={{ background: "#1a1a2e", color: "#fff" }}>Select a salon</option>
            {salons.map((s) => (
              <option key={s._id} value={s._id} style={{ background: "#1a1a2e", color: "#fff" }}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-2 pointer-events-none" />
        </div>
      </div>

      {/* Service Name */}
      <div>
        <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">
          Service Name <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
        </label>
        <input
          type="text"
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
          placeholder="e.g. Haircut, Facial, Manicure"
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
          <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">
            Base Price (Rs.) <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
          </label>
          <input
            type="number"
            min="0"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
            placeholder="0.00"
            value={formData.base_price}
            onChange={(e) =>
              setFormData({ ...formData, base_price: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">
            Duration (mins) <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
          </label>
          <input
            type="number"
            min="1"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
            placeholder="30"
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
        <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">
          Description <span className="text-muted-2/50 lowercase tracking-widest ml-1 font-bold">(optional)</span>
        </label>
        <textarea
          rows={3}
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2 resize-none"
          placeholder="Describe this service..."
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    service_name: "",
    base_price: "",
    duration: "",
    description: "",
    salon_id: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  // Get salonId from URL if present (for direct navigation to Add Service for a specific salon)
  const { salonId } = useParams();

  useEffect(() => {
    if (salonId) {
      // If we navigated to /AddService/:salonId, open modal for adding
      setEditingService(null);
      setFormData({ ...emptyForm, salon_id: salonId });
      setModalOpen(true);
    }
  }, [salonId]);

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
    <div>
      <PageHeader
        title="Services"
        subtitle="Manage services across all salons"
        backTo="/superAdminDashboard"
      >
        <Button variant="primary" icon={Plus} onClick={openAddModal}>
          Add Service
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-muted-2 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && servicesList.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <Scissors className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-2">Total</span>
            <span className="text-sm font-black text-white">
              {totalServices}
            </span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-2">Avg. Price</span>
            <span className="text-sm font-black text-success">
              Rs. {avgPrice.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
          <input
            placeholder="Search by service name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none bg-surface border border-border rounded-xl px-4 pr-9 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-accent uppercase tracking-wider"
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
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-2 pointer-events-none" />
        </div>

      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonServiceCard key={i} />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="No services found"
          description="No services match your current filters. Add a new service to get started."
          icon={Scissors}
          actionLabel="Add Service"
          onAction={openAddModal}
        />
      ) : (
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
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingService(null);
          setFormData(emptyForm);
        }}
        title={editingService ? "✏️ Edit Service" : "✨ Add New Service"}
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
