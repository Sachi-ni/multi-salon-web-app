import { useEffect, useState, useMemo } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";
import { getSalonFeedback } from "../../services/feedbackService";
import { getSalons } from "../../services/salonService";
import { 
  Star, MessageSquare, User, Scissors, Calendar, 
  Quote, MapPin, Search, LayoutGrid, List, ChevronDown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

function StarDisplay({ rating, max = 5, size = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star 
          key={i} 
          className={clsx(size, i < rating ? "text-amber-400 fill-amber-400" : "text-neutral-700")} 
        />
      ))}
    </div>
  );
}

export default function SuperAdminReviews() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [salons, setSalons] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all"); // "all" | "5" | "4" | "3" | "low"
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSalons()
      .then(res => setSalons(res.data || []))
      .catch(err => console.error("Failed to fetch salons", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    getSalonFeedback(selectedSalon)
      .then(res => setFeedbacks(res.data || []))
      .catch(err => setError(err.response?.data?.message || "Failed to load feedbacks."))
      .finally(() => setLoading(false));
  }, [selectedSalon]);

  // Aggregated Ratings Stats
  const stats = useMemo(() => {
    if (!feedbacks.length) return null;
    const totalService = feedbacks.reduce((acc, curr) => acc + (curr.serviceRating || 0), 0);
    const totalStaff = feedbacks.reduce((acc, curr) => acc + (curr.staffRating || 0), 0);
    const avgService = (totalService / feedbacks.length).toFixed(1);
    const avgStaff = (totalStaff / feedbacks.length).toFixed(1);
    const overall = (((totalService + totalStaff) / 2) / feedbacks.length).toFixed(1);

    const count5 = feedbacks.filter(f => Math.round((f.serviceRating + f.staffRating) / 2) === 5).length;
    const count4 = feedbacks.filter(f => Math.round((f.serviceRating + f.staffRating) / 2) === 4).length;
    const count3 = feedbacks.filter(f => Math.round((f.serviceRating + f.staffRating) / 2) === 3).length;

    return { avgService, avgStaff, overall, count: feedbacks.length, count5, count4, count3 };
  }, [feedbacks]);

  // Client-side Filtered Feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      // Rating filter
      const avgRating = Math.round(((f.serviceRating || 0) + (f.staffRating || 0)) / 2);
      if (ratingFilter === "5" && avgRating !== 5) return false;
      if (ratingFilter === "4" && avgRating !== 4) return false;
      if (ratingFilter === "3" && avgRating !== 3) return false;
      if (ratingFilter === "low" && avgRating > 2) return false;

      // Search term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const cust = (f.customer_id?.name || "").toLowerCase();
      const comment = (f.comment || "").toLowerCase();
      const service = (f.service_id?.service_name || "").toLowerCase();
      const staff = (f.staff_id?.full_name || "").toLowerCase();

      return cust.includes(term) || comment.includes(term) || service.includes(term) || staff.includes(term);
    });
  }, [feedbacks, ratingFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Reviews & Ratings"
        subtitle="Monitor customer feedback, service satisfaction, and staff ratings across all salon branches"
        backTo="/superAdminDashboard"
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-dim border border-danger-border text-sm text-danger">
          <span className="flex-1 font-semibold">{error}</span>
          <button onClick={() => setError("")} className="text-danger hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Top Analytics Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Rating Card */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black flex items-center justify-center font-black shadow-lg flex-shrink-0">
              <Star className="w-8 h-8 fill-black" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Overall Rating</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-white">{stats.overall}</span>
                <span className="text-sm font-bold text-neutral-400">/ 5.0</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">Based on {stats.count} customer review{stats.count !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Service & Staff Rating Progress */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card md:col-span-2 flex flex-col justify-center space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-neutral-300 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" /> Average Service Rating
                </span>
                <span className="text-amber-400 font-extrabold">{stats.avgService} / 5.0</span>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-border/40">
                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(stats.avgService / 5) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-neutral-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Average Staff Rating
                </span>
                <span className="text-amber-400 font-extrabold">{stats.avgStaff} / 5.0</span>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-border/40">
                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(stats.avgStaff / 5) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              placeholder="Search feedback by customer, service, staff, or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-glow-sm placeholder:text-neutral-500 font-medium"
            />
          </div>

          {/* Salon Selector */}
          <div className="relative">
            <select
              value={selectedSalon}
              onChange={(e) => setSelectedSalon(e.target.value)}
              className="appearance-none bg-surface border border-border rounded-xl px-4 pr-9 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-amber-400 uppercase tracking-wider"
            >
              <option value="all">All Salons</option>
              {salons.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>

          {/* Rating Filter Pills */}
          <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setRatingFilter("all")}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", ratingFilter === "all" ? "bg-amber-400 text-black font-extrabold" : "text-neutral-400 hover:text-white")}
            >
              All
            </button>
            <button
              onClick={() => setRatingFilter("5")}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1", ratingFilter === "5" ? "bg-amber-400 text-black font-extrabold" : "text-neutral-400 hover:text-white")}
            >
              5★
            </button>
            <button
              onClick={() => setRatingFilter("4")}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1", ratingFilter === "4" ? "bg-amber-400 text-black font-extrabold" : "text-neutral-400 hover:text-white")}
            >
              4★
            </button>
            <button
              onClick={() => setRatingFilter("low")}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1", ratingFilter === "low" ? "bg-amber-400 text-black font-extrabold" : "text-neutral-400 hover:text-white")}
            >
              1-2★
            </button>
          </div>
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

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface border border-border rounded-2xl animate-pulse space-y-4">
              <div className="h-4 w-40 bg-surface-2 rounded" />
              <div className="h-16 w-full bg-surface-2 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <EmptyState
          title="No reviews found"
          description="There is no customer feedback matching your selected filters."
          icon={MessageSquare}
        />
      ) : viewMode === "grid" ? (
        /* Grid / Card View */
        <div className="space-y-4">
          <AnimatePresence>
            {filteredFeedbacks.map((f, i) => {
              const customerName = f.customer_id?.name || "Guest Customer";
              const salonName = salons.find(s => s._id === f.salon_id)?.name || "Salon Branch";
              const avgScore = (((f.serviceRating || 0) + (f.staffRating || 0)) / 2).toFixed(1);

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  key={f._id} 
                  className="group bg-surface border border-border rounded-2xl p-6 hover:border-amber-400/40 hover:shadow-card-hover transition-all duration-300 space-y-4"
                >
                  {/* Top Header: Customer Info + Salon + Overall Star Pill */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black flex items-center justify-center text-base shadow-sm flex-shrink-0">
                        {customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white leading-tight">{customerName}</h3>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-neutral-300">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            {salonName}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            {f.appointment_id?.appointment_date || "Recent"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{avgScore} / 5.0</span>
                    </div>
                  </div>

                  {/* Ratings Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-surface-2/60 border border-border/70 rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Service Reviewed</span>
                        <span className="text-xs font-extrabold text-white">{f.service_id?.service_name || "General Service"}</span>
                      </div>
                      <StarDisplay rating={f.serviceRating || 5} />
                    </div>

                    <div className="bg-surface-2/60 border border-border/70 rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[0.65rem] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Staff Reviewed</span>
                        <span className="text-xs font-extrabold text-white">{f.staff_id?.full_name || "Stylist"}</span>
                      </div>
                      <StarDisplay rating={f.staffRating || 5} />
                    </div>
                  </div>

                  {/* Comment Section */}
                  {f.comment && (
                    <div className="bg-surface-2/40 rounded-xl p-4 border border-border/60 relative">
                      <Quote className="absolute top-3 left-3 w-6 h-6 text-amber-400/20 pointer-events-none" />
                      <p className="text-xs text-neutral-300 leading-relaxed italic font-medium pl-6">
                        "{f.comment}"
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Table View */
        <Table>
          <Table.Head>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Salon Branch</Table.Th>
            <Table.Th>Service & Rating</Table.Th>
            <Table.Th>Staff & Rating</Table.Th>
            <Table.Th>Customer Feedback</Table.Th>
          </Table.Head>
          <Table.Body>
            {filteredFeedbacks.map((f) => {
              const customerName = f.customer_id?.name || "Guest Customer";
              const salonName = salons.find(s => s._id === f.salon_id)?.name || "Salon";

              return (
                <tr key={f._id} className="hover:bg-surface-2/60 transition-colors">
                  <Table.Td bold className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-extrabold text-sm">{customerName}</span>
                  </Table.Td>
                  <Table.Td className="text-neutral-300 text-xs">{salonName}</Table.Td>
                  <Table.Td className="text-xs text-neutral-300">
                    <p className="font-bold text-white">{f.service_id?.service_name || "Service"}</p>
                    <StarDisplay rating={f.serviceRating || 5} size="w-3 h-3" />
                  </Table.Td>
                  <Table.Td className="text-xs text-neutral-300">
                    <p className="font-bold text-white">{f.staff_id?.full_name || "Staff"}</p>
                    <StarDisplay rating={f.staffRating || 5} size="w-3 h-3" />
                  </Table.Td>
                  <Table.Td className="text-xs text-neutral-300 italic max-w-xs truncate">
                    {f.comment ? `"${f.comment}"` : "No comment written"}
                  </Table.Td>
                </tr>
              );
            })}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
