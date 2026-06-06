import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getSalons } from "../../services/salonService";
import { createAppointment } from "../../services/appointmentService";
import StepSelectService from "../customer/steps/StepSelectService";
import StepSelectStaff from "../customer/steps/StepSelectStaff";
import StepSelectTimeSlot from "../customer/steps/StepSelectTimeSlot";
import { Search, User, Mail, Phone, ArrowLeft, Check } from "lucide-react";

const STEPS = ["Customer", "Salon", "Date", "Service", "Staff", "Time Slot", "Confirm"];

export default function AddAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [salons, setSalons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [booking, setBooking] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    salonId: "",
    salonName: "",
    date: "",
    serviceId: "",
    serviceName: "",
    serviceDuration: 0,
    servicePrice: 0,
    staffId: "",
    staffName: "",
    staffSpecification: "",
    startTime: "",
    endTime: "",
  });

  // Fetch salons and customers on mount
  useEffect(() => {
    getSalons()
      .then((res) => setSalons(res.data || []))
      .catch((err) => console.error("Error loading salons", err));
    
    setLoadingCustomers(true);
    api.get("/customers")
      .then((res) => {
        setCustomers(res.data || []);
      })
      .catch((err) => {
        setCustomerError("Failed to load customers.");
        console.error("Error loading customers", err);
      })
      .finally(() => {
        setLoadingCustomers(false);
      });
  }, []);

  const next = (data) => {
    setBooking((prev) => ({ ...prev, ...data }));
    setStep((s) => s + 1);
  };

  const back = () => {
    // Clear downstream selections when going back
    if (step === 1) {
      // Going back from Salon -> Customer
      setBooking((prev) => ({
        ...prev,
        salonId: "",
        salonName: "",
      }));
    } else if (step === 2) {
      // Going back from Date -> Salon
      setBooking((prev) => ({
        ...prev,
        date: "",
      }));
    } else if (step === 3) {
      // Going back from Service -> Date
      setBooking((prev) => ({
        ...prev,
        serviceId: "",
        serviceName: "",
        serviceDuration: 0,
        servicePrice: 0,
      }));
    } else if (step === 4) {
      // Going back from Staff -> Service
      setBooking((prev) => ({
        ...prev,
        staffId: "",
        staffName: "",
        staffSpecification: "",
      }));
    } else if (step === 5) {
      // Going back from Time Slot -> Staff
      setBooking((prev) => ({
        ...prev,
        startTime: "",
        endTime: "",
      }));
    }
    setStep((s) => s - 1);
  };

  const filteredCustomers = customers.filter((c) => {
    const term = customerSearch.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.phone || "").toLowerCase().includes(term)
    );
  });

  // Render helper for Step 6 — Admin Confirm
  const renderConfirm = () => {
    const durationHours = Math.ceil(booking.serviceDuration / 60);

    const formatTime = (time) => {
      if (!time) return "";
      const [h, m] = time.split(":").map(Number);
      const suffix = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
    };

    const handleConfirmSubmit = async () => {
      try {
        await createAppointment({
          salon_id: booking.salonId,
          service_id: booking.serviceId,
          staff_id: booking.staffId,
          appointment_date: booking.date,
          start_time: booking.startTime,
          customer_id: booking.customerId,
          notes: "Booked by Admin",
        });
        navigate("/Appointments");
      } catch (err) {
        alert(err.response?.data?.message || "Booking failed. Please check slot availability.");
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-white mb-1">Confirm Booking</h2>
        <p className="text-muted-2 text-sm mb-5">Review appointment details before final submission</p>

        <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-4">
          {/* Customer Info */}
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Customer</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center flex-shrink-0">
                <span className="font-black text-xs">{booking.customerName?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{booking.customerName}</p>
                <p className="text-muted-2 text-xs">{booking.customerEmail} | {booking.customerPhone || "No Phone"}</p>
              </div>
            </div>
          </div>

          {/* Salon & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-3 rounded-lg p-3">
              <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Salon</p>
              <p className="text-white font-bold text-sm">{booking.salonName}</p>
            </div>
            <div className="bg-surface-3 rounded-lg p-3">
              <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Date</p>
              <p className="text-white font-bold text-sm">{booking.date}</p>
            </div>
          </div>

          {/* Service */}
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Service</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">{booking.serviceName}</p>
                <p className="text-muted-2 text-xs mt-0.5">
                  {durationHours} {durationHours === 1 ? "Hour" : "Hours"}
                </p>
              </div>
              <p className="text-accent font-extrabold text-sm">LKR {booking.servicePrice}</p>
            </div>
          </div>

          {/* Staff */}
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Staff Member</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center flex-shrink-0">
                <span className="font-black text-xs">{booking.staffName?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{booking.staffName}</p>
                {booking.staffSpecification && (
                  <p className="text-muted-2 text-xs">{booking.staffSpecification}</p>
                )}
              </div>
            </div>
          </div>

          {/* Time Slot */}
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Time Slot</p>
            <div className="flex items-center justify-between">
              <p className="text-white font-bold text-sm">
                {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
              </p>
              {durationHours > 1 && (
                <span className="px-2 py-0.5 bg-accent-dim text-accent text-xs font-bold rounded border border-accent/20">
                  {durationHours} Slots
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={back} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
            ← Back
          </button>
          <button
            onClick={handleConfirmSubmit}
            className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 hover:shadow-glow"
          >
            Create Appointment ✓
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/superAdminDashboard")}
          className="flex items-center gap-2 text-xs font-bold text-muted-2 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Create Appointment</h1>
        <p className="text-muted-2 text-sm mt-1">Book an appointment on behalf of a customer</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2 scrollbar-none">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none min-w-[70px]">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200
                ${i < step ? "bg-accent text-primary" : ""}
                ${i === step ? "bg-accent text-primary shadow-glow" : ""}
                ${i > step ? "bg-surface-2 text-muted-2 border border-border" : ""}
              `}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[0.65rem] mt-1 font-bold tracking-wide ${i === step ? "text-accent" : "text-muted-2"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 mb-4 transition-all duration-300 min-w-[15px]
                ${i < step ? "bg-accent" : "bg-border"}
              `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card">
        {/* Step 0 — Select Customer */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-extrabold text-white mb-1">Select Customer</h2>
            <p className="text-muted-2 text-sm mb-5">Choose the customer for this appointment</p>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-accent transition-all placeholder:text-muted-2"
              />
            </div>

            {customerError && <p className="text-danger text-sm mb-4">{customerError}</p>}

            {loadingCustomers ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {filteredCustomers.map((c) => {
                  const isSelected = booking.customerId === c._id;
                  return (
                    <div
                      key={c._id}
                      onClick={() =>
                        setBooking((prev) => ({
                          ...prev,
                          customerId: c._id,
                          customerName: c.name,
                          customerEmail: c.email,
                          customerPhone: c.phone,
                        }))
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between
                        ${
                          isSelected
                            ? "border-accent bg-accent-dim shadow-glow-sm"
                            : "border-border bg-surface-2 hover:border-border-hover"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-accent">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{c.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-muted" />
                              {c.email}
                            </span>
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted" />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <p className="text-center text-muted-2 text-sm py-4">No customers found.</p>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                disabled={!booking.customerId}
                onClick={() => setStep(1)}
                className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Select Salon */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-extrabold text-white mb-1">Select a Salon</h2>
            <p className="text-muted-2 text-sm mb-5">Choose the salon for this appointment</p>
            <div className="space-y-3">
              {salons.map((s) => {
                const isSelected = booking.salonId === s._id;
                return (
                  <div
                    key={s._id}
                    onClick={() =>
                      setBooking((prev) => ({
                        ...prev,
                        salonId: s._id,
                        salonName: s.name,
                      }))
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${
                        isSelected
                          ? "border-accent bg-accent-dim shadow-glow-sm"
                          : "border-border bg-surface-2 hover:border-border-hover"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-muted-2 text-sm mt-0.5">{s.location}</p>
                        <p className="text-muted text-xs mt-1">
                          {s.open_time} – {s.close_time}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={back} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
                ← Back
              </button>
              <button
                disabled={!booking.salonId}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Select Date */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-extrabold text-white mb-1">Select a Date</h2>
            <p className="text-muted-2 text-sm mb-5">Choose the date for the appointment</p>
            <input
              type="date"
              value={booking.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setBooking((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:bg-accent-dim/20 transition-all duration-200 cursor-pointer"
            />
            <div className="flex justify-between mt-6">
              <button onClick={back} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
                ← Back
              </button>
              <button
                disabled={!booking.date}
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Select Service */}
        {step === 3 && <StepSelectService booking={booking} onNext={next} onBack={back} />}

        {/* Step 4 — Select Staff */}
        {step === 4 && <StepSelectStaff booking={booking} onNext={next} onBack={back} />}

        {/* Step 5 — Select Time Slot */}
        {step === 5 && <StepSelectTimeSlot booking={booking} onNext={next} onBack={back} />}

        {/* Step 6 — Confirm */}
        {step === 6 && renderConfirm()}
      </div>
    </div>
  );
}
