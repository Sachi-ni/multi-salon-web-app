import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Scissors, Calendar, ArrowRight, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { getSalons } from "../../../services/salonService";
import { getServices } from "../../../services/serviceService";

const QuickBooking = () => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Today's date as minimum selectable date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getSalons().catch(() => ({ data: [] })),
      getServices().catch(() => ({ data: [] })),
    ]).then(([salonRes, serviceRes]) => {
      if (!isMounted) return;
      const salonList = salonRes.data || [];
      const serviceList = serviceRes.data || [];
      setSalons(salonList);
      setServices(serviceList);
      if (salonList.length > 0) {
        setSelectedSalonId(salonList[0]._id);
      }
      setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  // Filter services by the selected salon if services carry salon_id
  const filteredServices = services.filter((svc) => {
    if (!selectedSalonId) return true;
    const svcSalonId = svc.salon_id?._id || svc.salon_id;
    return !svcSalonId || svcSalonId === selectedSalonId;
  });

  const handleContinueBooking = (e) => {
    e.preventDefault();
    const chosenSalon = salons.find((s) => s._id === selectedSalonId) || salons[0] || null;
    const chosenService = services.find((s) => s._id === selectedServiceId) || null;

    // Save preliminary selection into existing draft storage so BookAppointment picks it up smoothly
    try {
      const draft = {
        salonId: chosenSalon?._id || "",
        salonName: chosenSalon?.name || "",
        date: selectedDate || todayStr,
        services: chosenService
          ? [
              {
                serviceId: chosenService._id,
                serviceName: chosenService.service_name,
                duration: chosenService.duration || 30,
                price: chosenService.base_price || 0,
                staffId: "",
                staffName: "",
                startTime: "",
                endTime: "",
              },
            ]
          : [],
        serviceId: chosenService?._id || "",
        serviceName: chosenService?.service_name || "",
        serviceDuration: chosenService?.duration || 0,
        servicePrice: chosenService?.base_price || 0,
        totalDuration: chosenService?.duration || 0,
        totalPrice: chosenService?.base_price || 0,
        staffId: "",
        staffName: "",
        staffSpecification: "",
        startTime: "",
        endTime: "",
      };

      sessionStorage.setItem("appointment_booking_draft", JSON.stringify(draft));
      // If salon, date, and service are chosen, advance step to 3 (staff & time), else step 1 or 2
      const stepIndex = chosenService && selectedDate ? 2 : chosenSalon ? 1 : 0;
      sessionStorage.setItem("appointment_booking_step", String(stepIndex));
    } catch {
      // Storage fallback
    }

    navigate("/book", {
      state: {
        salon: chosenSalon,
        preselectedService: chosenService,
        preselectedDate: selectedDate,
      },
    });
  };

  return (
    <section id="book-quick" className="relative z-30 -mt-10 sm:-mt-14 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl bg-surface/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 md:p-10 relative overflow-hidden"
      >
        {/* Subtle Ambient Gold Glow in corner */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Section Header with Trust Badges */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Reservation
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
              Book Your Salon Visit in <span className="text-gradient">Seconds</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Instant Confirmation
            </span>
            <span className="hidden sm:inline-block">•</span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              Zero Waiting Time
            </span>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <form onSubmit={handleContinueBooking} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Branch Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              Select Salon Branch
            </label>
            <div className="relative">
              <select
                value={selectedSalonId}
                onChange={(e) => {
                  setSelectedSalonId(e.target.value);
                  setSelectedServiceId("");
                }}
                disabled={isLoading || salons.length === 0}
                className="w-full bg-surface-2/80 border border-white/10 text-white rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer appearance-none"
              >
                {salons.length === 0 ? (
                  <option value="">{isLoading ? "Loading salons..." : "No branches found"}</option>
                ) : (
                  salons.map((salon) => (
                    <option key={salon._id} value={salon._id} className="bg-surface-2 text-white">
                      {salon.name} {salon.address?.city ? `(${salon.address.city})` : ""}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-xs">▼</div>
            </div>
          </div>

          {/* 2. Service Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-accent" />
              Choose Service
            </label>
            <div className="relative">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                disabled={isLoading}
                className="w-full bg-surface-2/80 border border-white/10 text-white rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer appearance-none"
              >
                <option value="" className="bg-surface-2 text-white">
                  {filteredServices.length === 0 ? "All Available Services" : "Any Service / Choose Later"}
                </option>
                {filteredServices.map((svc) => (
                  <option key={svc._id} value={svc._id} className="bg-surface-2 text-white">
                    {svc.service_name} • LKR {Number(svc.base_price || 0).toLocaleString()}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-xs">▼</div>
            </div>
          </div>

          {/* 3. Appointment Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Preferred Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-surface-2/80 border border-white/10 text-white rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* 4. Continue Booking CTA Button */}
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-accent text-primary font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(245,200,0,0.35)] hover:bg-accent-hover hover:shadow-[0_4px_30px_rgba(245,200,0,0.6)] active:scale-[0.98] transition-all duration-300 group"
            >
              <span>Continue Booking</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
};

export default QuickBooking;

