import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { getSalons } from "../../services/salonService";
import StepSelectService from "./steps/StepSelectService";
import StepAssignStaffAndTime from "./steps/StepAssignStaffAndTime";
import StepBookingConfirm from "./steps/StepBookingConfirm";
import CustomerDashboardBackground from "../../components/ui/CustomerDashboardBackground";

const DEFAULT_STEPS = ["Salon", "Date", "Services", "Staff & Time", "Confirm"];

export default function BookAppointment() {
  const [booking, setBooking] = useState(() => {
    try {
      const saved = sessionStorage.getItem("appointment_booking_draft");
      return saved ? JSON.parse(saved) : {
        salonId: "", salonName: "",
        date: "",
        services: [],
        serviceId: "", serviceName: "", serviceDuration: 0, servicePrice: 0,
        totalDuration: 0, totalPrice: 0,
        staffId: "", staffName: "", staffSpecification: "",
        startTime: "", endTime: "",
      };
    } catch {
      return {
        salonId: "", salonName: "",
        date: "",
        services: [],
        serviceId: "", serviceName: "", serviceDuration: 0, servicePrice: 0,
        totalDuration: 0, totalPrice: 0,
        staffId: "", staffName: "", staffSpecification: "",
        startTime: "", endTime: "",
      };
    }
  });

  const [step, setStep] = useState(() => {
    try {
      const savedStep = sessionStorage.getItem("appointment_booking_step");
      const stepNum = savedStep ? parseInt(savedStep, 10) : 0;
      return isNaN(stepNum) ? 0 : stepNum;
    } catch {
      return 0;
    }
  });

  const [salons, setSalons] = useState([]);
  const [salonError, setSalonError] = useState("");

  const location = useLocation();
  const dateInputRef = useRef(null);
  const isStaffBooking = Boolean(location.state?.staff);
  const isSalonBooking = Boolean(location.state?.salon) && !isStaffBooking;
  const steps = isStaffBooking
    ? ["Date", "Services", "Time", "Confirm"]
    : isSalonBooking
      ? ["Date", "Services", "Staff & Time", "Confirm"]
      : DEFAULT_STEPS;
  const displayedStep = isStaffBooking
    ? step
    : isSalonBooking
      ? step - 1
      : step;

  // Persist draft and step state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("appointment_booking_draft", JSON.stringify(booking));
      sessionStorage.setItem("appointment_booking_step", String(step));
    } catch {
      // Ignore quota errors
    }
  }, [booking, step]);

  // Validate step state against booking data on reload/step change
  // If required state is missing, gracefully fallback to step 0 (initial process)
  useEffect(() => {
    if (isStaffBooking && step > 0 && !booking.salonId) {
      setStep(0);
    } else if (isStaffBooking && step > 0 && !booking.date) {
      setStep(0);
    } else if (isStaffBooking && step > 1 && (!booking.services || booking.services.length === 0)) {
      setStep(0);
    } else if (!isStaffBooking && step > 0 && !booking.salonId) {
      setStep(0);
    } else if (step > 1 && !booking.date) {
      setStep(0);
    } else if ((step === 3 || step === 4) && (!booking.services || booking.services.length === 0)) {
      setStep(0);
    }
  }, [step, booking.salonId, booking.date, booking.services, isStaffBooking]);

  const openDatePicker = () => {
    const dateInput = dateInputRef.current;
    if (!dateInput) return;

    dateInput.focus();
    // Chrome/Edge expose showPicker; other browsers still open it via focus/click.
    if (typeof dateInput.showPicker === "function") {
      try {
        dateInput.showPicker();
      } catch {
        // The focused native input remains usable in browsers that reject showPicker.
      }
    }
  };

  const loadSalons = useCallback(() => {
    setSalonError("");
    getSalons()
      .then(res => setSalons(res.data || []))
      .catch(err => setSalonError(err?.response?.data?.message || "Failed to load salons. Please try again."));
  }, []);

  useEffect(() => {
    loadSalons();

    if (location.state?.staff) {
      const staff = location.state.staff;
      setBooking(prev => ({
        ...prev,
        salonId: staff.salon?._id || staff.salon_id?._id || staff.salonId || "",
        salonName: staff.salon?.name || staff.salon_id?.name || staff.salonName || "",
        staffId: staff._id || staff.staff_id,
        staffName: staff.name || staff.full_name,
        staffSpecification: staff.specification || "",
      }));
      setStep(0);
    } else if (location.state?.salon) {
      const salon = location.state.salon;
      setBooking(prev => ({
        ...prev,
        salonId: salon._id || "",
        salonName: salon.name || ""
      }));
      setStep(1);
    }
  }, [location.state, loadSalons]);

  const next = (data) => {
    setBooking(prev => ({ ...prev, ...data }));
    setStep(s => s + 1);
  };

  const back = () => {
    if (isStaffBooking) {
      if (step === 1) {
        setBooking(prev => ({ ...prev, date: "" }));
      }
      if (step === 0) return;
      setStep(s => s - 1);
      return;
    }

    // Clear downstream selections when going back
    if (step === 3) {
      // Going back from Staff & Time → clear per-service staff/time
      setBooking(prev => ({
        ...prev,
        services: prev.services.map(s => ({
          ...s, staffId: "", staffName: "", staffSpecification: "", startTime: "", endTime: ""
        }))
      }));
    } else if (step === 2) {
      // Going back from Service → clear everything below date
      setBooking(prev => ({
        ...prev,
        services: [],
        serviceId: "", serviceName: "", serviceDuration: 0, servicePrice: 0,
        totalDuration: 0, totalPrice: 0,
      }));
    }
    setStep(s => s - 1);
  };

  return (
    <div className="relative overflow-hidden min-h-[80vh]">
      {/* Premium Salon-Themed Background */}
      <CustomerDashboardBackground />

      <div className="max-w-2xl mx-auto relative z-10 px-4 sm:px-0">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-black text-white">Book an Appointment</h1>
          <p className="text-muted-2 text-sm mt-1">Follow the steps to complete your booking</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-6 sm:mb-8">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200
                  ${i < displayedStep ? "bg-accent text-primary" : ""}
                  ${i === displayedStep ? "bg-accent text-primary shadow-glow" : ""}
                  ${i > displayedStep ? "bg-surface-2 text-muted-2 border border-border" : ""}
                `}>
                  {i < displayedStep ? (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-2xs mt-1 font-bold tracking-wide hidden sm:block
                  ${i === displayedStep ? "text-accent" : "text-muted-2"}
                `}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-1.5 sm:mx-2 mb-0 sm:mb-4 transition-all duration-300
                  ${i < displayedStep ? "bg-accent" : "bg-border"}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-card animate-fade-up">

          {/* Step 0 — Salon */}
          {!isStaffBooking && step === 0 && (
            <div>
              <h2 className="text-lg font-extrabold text-white mb-1">Select a Salon</h2>
              <p className="text-muted-2 text-sm mb-5">Choose the salon you'd like to visit</p>
              {salonError && (
                <div className="p-3 bg-danger-dim border border-danger-border rounded-xl mb-4">
                  <p className="text-danger text-xs font-bold">{salonError}</p>
                  <button
                    onClick={loadSalons}
                    className="mt-2 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-accent text-xs font-bold hover:border-accent transition-all duration-200"
                  >
                    Retry
                  </button>
                </div>
              )}
              <div className="space-y-3">
                {salons.map(s => (
                  <div
                    key={s._id}
                    onClick={() => {
                      setBooking(prev => ({
                        ...prev,
                        salonId: s._id,
                        salonName: s.name,
                        ...(prev.salonId !== s._id
                          ? {
                              services: [],
                              serviceId: "",
                              serviceName: "",
                              serviceDuration: 0,
                              servicePrice: 0,
                              totalDuration: 0,
                              totalPrice: 0,
                              staffId: "",
                              staffName: "",
                              staffSpecification: "",
                              startTime: "",
                              endTime: "",
                            }
                          : {})
                      }));
                      setStep(1);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                      ${booking.salonId === s._id
                        ? "border-accent bg-accent-dim shadow-glow-sm"
                        : "border-border bg-surface-2 hover:border-accent/50 hover:bg-surface-3"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white group-hover:text-accent transition-colors">{s.name}</p>
                        <p className="text-muted-2 text-sm mt-0.5">{s.location}</p>
                        <p className="text-muted text-xs mt-1">{s.open_time} – {s.close_time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.salonId === s._id && (
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <span className="text-xs text-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          {((isStaffBooking && step === 0) || (!isStaffBooking && step === 1)) && (
            <div>
              <h2 className="text-lg font-extrabold text-white mb-1">Select a Date</h2>
              <p className="text-muted-2 text-sm mb-5">Choose the date for your appointment</p>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={booking.date}
                  min={new Date().toLocaleDateString('en-CA')}
                  onChange={e => {
                    const date = e.target.value;
                    setBooking(prev => ({ ...prev, date }));
                    if (date) setStep(isStaffBooking ? 1 : 2);
                  }}
                  onClick={openDatePicker}
                  style={{ colorScheme: "dark" }}
                  className="appointment-date-input w-full bg-surface-2 border border-border rounded-xl px-4 py-3 pr-14 text-white text-sm outline-none focus:border-accent focus:bg-accent-dim/20 transition-all duration-200 cursor-pointer"
                  aria-label="Appointment date"
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  aria-label="Open date picker"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-accent hover:bg-accent-dim focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                >
                  <CalendarDays className="h-5 w-5" />
                </button>
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={back} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* Staff entry keeps the selected staff fixed. */}
          {isStaffBooking && step === 1 && (
            <StepSelectService booking={booking} onNext={next} onBack={back} />
          )}

          {/* Step 2 — Services */}
          {!isStaffBooking && step === 2 && <StepSelectService booking={booking} onNext={next} onBack={back} />}

          {/* Step 3 — Staff & Time */}
          {!isStaffBooking && step === 3 && <StepAssignStaffAndTime booking={booking} autoAdvance onNext={next} onBack={back} />}
          {isStaffBooking && step === 2 && (
            <StepAssignStaffAndTime
              booking={booking}
              autoAdvance
              fixedStaff={{
                staffId: booking.staffId,
                staffName: booking.staffName,
                staffSpecification: booking.staffSpecification,
              }}
              onNext={next}
              onBack={back}
            />
          )}

          {/* Step 4 — Confirm */}
          {!isStaffBooking && step === 4 && <StepBookingConfirm booking={booking} onBack={back} />}
          {isStaffBooking && step === 3 && <StepBookingConfirm booking={booking} onBack={back} />}
        </div>
      </div>
    </div>
  );
}
