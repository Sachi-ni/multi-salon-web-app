import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getServices } from "../../services/serviceService";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";
import { Scissors, Clock, MapPin, Search, LayoutGrid, List, Plus, Sparkles, Coins } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

const ServiceCard = ({ service, index }) => {
  const salonName = service.salon_id?.name || "Salon Branch";

  const formatDuration = (mins) => {
    if (!mins) return "0 mins";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} mins`;
    if (h > 0) return `${h} hr${h > 1 ? "s" : ""}`;
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
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        <div className="p-5">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0 text-amber-400 group-hover:border-amber-400/50 transition-colors">
              <Scissors className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-white leading-tight truncate group-hover:text-amber-400 transition-colors">
                {service.service_name}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="truncate">{salonName}</span>
              </p>
            </div>
          </div>

          {service.description && (
            <p className="text-xs text-neutral-400 leading-relaxed mb-4 line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="bg-surface-2/60 border border-border/70 rounded-xl p-3 flex items-center justify-between text-xs mb-4">
            <span className="text-neutral-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Duration:
            </span>
            <span className="text-white font-extrabold">{formatDuration(service.duration)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-surface-2/30 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-amber-400 font-black text-sm">
          <Coins className="w-4 h-4" />
          <span>LKR {Number(service.base_price || 0).toLocaleString()}</span>
        </div>
        <Badge variant="success" dot={true}>
          Active
        </Badge>
      </div>
    </motion.div>
  );
};

export default function AdminServicesPage() {
  const { salonId } = useParams();
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  useEffect(() => {
    setLoading(true);
    setError("");
    getServices(salonId)
      .then((res) => setServicesList(res.data || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load services"))
      .finally(() => setLoading(false));
  }, [salonId]);

  const filteredServices = useMemo(() => {
    if (!searchTerm) return servicesList;
    const term = searchTerm.toLowerCase();
    return servicesList.filter((s) => {
      const name = (s.service_name || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [servicesList, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader title="Services Catalog" subtitle="Catalog of salon services, pricing, and treatment durations" backTo={`/salon-admin/${salonId}/adminDashboard`} />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-dim border border-danger-border text-sm text-danger">
          <span className="flex-1 font-semibold">{error}</span>
          <button onClick={() => setError("")} className="text-danger hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            placeholder="Search service by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 placeholder:text-neutral-500 font-medium"
          />
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
            <div key={i} className="p-5 bg-surface border border-border rounded-2xl animate-pulse space-y-4">
              <div className="w-12 h-12 bg-surface-2 rounded-2xl" />
              <div className="h-4 w-32 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="No services found"
          description="No salon services match your search criteria."
          icon={Scissors}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service, index) => (
            <ServiceCard key={service._id} service={service} index={index} />
          ))}
        </div>
      ) : (
        /* Table View */
        <Table>
          <Table.Head>
            <Table.Th>Service Name</Table.Th>
            <Table.Th>Branch Location</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th align="right">Base Price</Table.Th>
            <Table.Th align="right">Status</Table.Th>
          </Table.Head>
          <Table.Body>
            {filteredServices.map((service) => (
              <tr key={service._id} className="hover:bg-surface-2/60 transition-colors">
                <Table.Td bold className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <span className="text-white font-extrabold text-sm">{service.service_name}</span>
                </Table.Td>
                <Table.Td className="text-neutral-300 text-xs">{service.salon_id?.name || "Salon Branch"}</Table.Td>
                <Table.Td className="text-xs text-neutral-300 font-semibold">{service.duration} mins</Table.Td>
                <Table.Td align="right" className="text-amber-400 font-black text-xs">
                  LKR {Number(service.base_price || 0).toLocaleString()}
                </Table.Td>
                <Table.Td align="right">
                  <Badge variant="success" dot={true}>Active</Badge>
                </Table.Td>
              </tr>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}