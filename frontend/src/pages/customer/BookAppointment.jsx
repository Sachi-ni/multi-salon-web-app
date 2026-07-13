import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSalons } from "../../services/salonService";
import StepSelectService from "./steps/StepSelectService";
import StepAssignStaffAndTime from "./steps/StepAssignStaffAndTime";
import StepBookingConfirm from "./steps/StepBookingConfirm";
import CustomerDashboardBackground from "../../components/ui/CustomerDashboardBackground";

const STEPS = ["Salon", "Date", "Services", "Staff & Time", "Confirm"];

export default function BookAppointment() {
  const [step, setStep] = useState(0);
  const [salons, setSalons] = useState([]);
  const [booking, setBooking] = useState({
    salonId: "", salonName: "",
    date: "",
    services: [],  // array of { serviceId, serviceName, serviceDuration, servicePrice }
    serviceId: "", serviceName: "", serviceDuration: 0, servicePrice: 0,
    totalDuration: 0, totalPrice: 0,
    staffId: "", staffName: "", staffSpecification: "",
    startTime: "", endTime: "",
  });

  const location = useLocation();

  useEffect(() => {
    getSalons().then(res => setSalons(res.data));

    if (location.state?.staff) {
      const staff = location.state.staff;
      setBooking(prev => ({
        ...prev,
        salonId: staff.salon_id?._id || "",
        salonName: staff.salon_id?.name || "",
        staffId: staff._id,
        staffName: staff.name,
        staffSpecification: staff.specification || "",
      }));
    } else if (location.state?.salon) {
      const salon = location.state.salon;
      setBooking(prev => ({
        ...prev,
        salonId: salon._id || "",
        salonName: salon.name || ""
      }));
    }
  }, [location.state]);

  const next = (data) => {
    setBooking(prev => ({ ...prev, ...data }));
    setStep(s => s + 1);
  };

  const back = () => {
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

      <div className="max-w-2xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Book an Appointment</h1>
          <p className="text-muted-2 text-sm mt-1">Follow the steps to complete your booking</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200
                  ${i < step ? "bg-accent text-primary" : ""}
                  ${i === step ? "bg-accent text-primary shadow-glow" : ""}
                  ${i > step ? "bg-surface-2 text-muted-2 border border-border" : ""}
                `}>
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-2xs mt-1 font-bold tracking-wide
                  ${i === step ? "text-accent" : "text-muted-2"}
                `}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 transition-all duration-300
                  ${i < step ? "bg-accent" : "bg-border"}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-card animate-fade-up">

          {/* Step 0 — Salon */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-extrabold text-white mb-1">Select a Salon</h2>
              <p className="text-muted-2 text-sm mb-5">Choose the salon you'd like to visit</p>
              <div className="space-y-3">
                {salons.map(s => (
                  <div
                    key={s._id}
                    onClick={() => setBooking(prev => ({ ...prev, salonId: s._id, salonName: s.name }))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${booking.salonId === s._id
                        ? "border-accent bg-accent-dim shadow-glow-sm"
                        : "border-border bg-surface-2 hover:border-border-hover"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-muted-2 text-sm mt-0.5">{s.location}</p>
                        <p className="text-muted text-xs mt-1">{s.open_time} – {s.close_time}</p>
                      </div>
                      {booking.salonId === s._id && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  disabled={!booking.salonId}
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 1 — Date */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-extrabold text-white mb-1">Select a Date</h2>
              <p className="text-muted-2 text-sm mb-5">Choose the date for your appointment</p>
              <input
                type="date"
                value={booking.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setBooking(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:bg-accent-dim/20 transition-all duration-200 cursor-pointer"
              />
              <div className="flex justify-between mt-6">
                <button onClick={back} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
                  ← Back
                </button>
                <button
                  disabled={!booking.date}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Services */}
          {step === 2 && <StepSelectService booking={booking} onNext={next} onBack={back} />}

          {/* Step 3 — Staff & Time */}
          {step === 3 && <StepAssignStaffAndTime booking={booking} onNext={next} onBack={back} />}

          {/* Step 4 — Confirm */}
          {step === 4 && <StepBookingConfirm booking={booking} onBack={back} />}
        </div>
      </div>
    </div>
  );
}