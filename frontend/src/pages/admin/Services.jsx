import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getServices } from "../../services/serviceService";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Scissors, Clock, DollarSign, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";

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
  </div>
);

const ServiceCard = ({ service, index }) => {
  const salonName = service.salon_id?.name || "Unknown Salon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group bg-surface border border-border rounded-xl overflow-hidden transition-all duration-250 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(245,200,0,0.06)]"
    >
      <div className="h-[2px] bg-gradient-to-r from-accent via-accent-hover to-accent" />

      <div className="p-5">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors duration-200">
            <Scissors className="w-5 h-5 text-accent" />
          </div>

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
        </div>

        {service.description && (
          <p className="text-xs text-muted-2 leading-relaxed mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

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

const Services = () => {
  const { salonId } = useParams();
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getServices(salonId);
      setServicesList(res.data || []);
    } catch (err) {
      setError("Failed to load services data");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredServices = servicesList.filter((s) =>
    (s.service_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Services offered at this branch"
        backTo={`/salon-admin/${salonId}/adminDashboard`}
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-muted-2 hover:text-white text-lg leading-none">
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
          <input
            placeholder="Search by service name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-accent focus:shadow-glow-sm placeholder:text-muted-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonServiceCard key={i} />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="No services found"
          description="This salon doesn't have any services yet."
          icon={Scissors}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredServices.map((s, i) => (
            <ServiceCard key={s._id} service={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;