import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getSalons } from "../../services/salonService";
import { createAppointment } from "../../services/appointmentService";
import StepSelectService from "../customer/steps/StepSelectService";
import StepAssignStaffAndTime from "../customer/steps/StepAssignStaffAndTime";
import { Search, User, Mail, Phone, ArrowLeft, Check } from "lucide-react";

const STEPS = ["Customer", "Salon", "Date", "Services", "Staff & Time", "Confirm"];

export default function AddAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [salons, setSalons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [customerType, setCustomerType] = useState("registered");
  const [booking, setBooking] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    salonId: "",
    salonName: "",
    date: "",
    services: [], // array of { serviceId, serviceName, serviceDuration, servicePrice }
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
      // Service -> Date
      setBooking((prev) => ({
        ...prev,
        services: [],
        serviceId: "",
        serviceName: "",
        serviceDuration: 0,
        servicePrice: 0,
        totalDuration: 0,
        totalPrice: 0,
      }));
    } else if (step === 4) {
      // Staff & Time -> Services
      setBooking((prev) => ({
        ...prev,
        services: prev.services.map(s => ({
          ...s, staffId: "", staffName: "", staffSpecification: "", startTime: "", endTime: ""
        }))
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
    const formatTime = (time) => {
      if (!time) return "";
      const [h, m] = time.split(":").map(Number);
      const suffix = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
    };

    const handleConfirmSubmit = async () => {
      try {
        const servicesPayload = booking.services.map(s => ({
          service_id: s.serviceId,
          staff_id: s.staffId,
          start_time: s.startTime
        }));

        await createAppointment({
          salon_id: booking.salonId,
          appointment_date: booking.date,
          services: servicesPayload,
          customer_id: booking.customerId === "guest" ? undefined : booking.customerId,
          guest_name: booking.customerId === "guest" ? booking.customerName : "",
          guest_phone: booking.customerId === "guest" ? booking.customerPhone : "",
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

          {/* Services */}
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">
              Services & Assigned Staff
            </p>
            <div className="space-y-3">
              {booking.services.map((svc, idx) => {
                const svcHours = Math.ceil(svc.serviceDuration / 60);
                return (
                  <div key={idx} className="pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-white font-bold text-sm">{svc.serviceName}</p>
                      <p className="text-accent font-extrabold text-sm">LKR {svc.servicePrice}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-2">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-white font-semibold">{svc.staffName}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(svc.startTime)} — {formatTime(svc.endTime)}
                      </span>
                      <span>·</span>
                      <span>{svcHours} {svcHours === 1 ? "hr" : "hrs"}</span>
                    </div>
                  </div>
                );
              })}
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
            <h2 className="text-lg font-extrabold text-white mb-1">Customer Details</h2>
            <p className="text-muted-2 text-sm mb-5">Choose or enter the customer for this appointment</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-surface-2 rounded-xl">
              <button
                onClick={() => setCustomerType("registered")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  customerType === "registered" ? "bg-accent text-primary shadow-glow-sm" : "text-muted-2 hover:text-white"
                }`}
              >
                Registered
              </button>
              <button
                onClick={() => {
                  setCustomerType("guest");
                  setBooking(prev => ({
                    ...prev,
                    customerId: "guest",
                    customerName: "",
                    customerPhone: "",
                    customerEmail: ""
                  }));
                }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  customerType === "guest" ? "bg-accent text-primary shadow-glow-sm" : "text-muted-2 hover:text-white"
                }`}
              >
                Guest (Unregistered)
              </button>
            </div>

            {customerType === "registered" ? (
              <>
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
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-2 mb-1.5 uppercase tracking-wide">Guest Name</label>
                  <input
                    type="text"
                    value={booking.customerName}
                    onChange={(e) => setBooking(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter guest name"
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-2 mb-1.5 uppercase tracking-wide">Guest Phone</label>
                  <input
                    type="text"
                    value={booking.customerPhone}
                    onChange={(e) => setBooking(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="Enter guest phone (optional)"
                    className={`w-full bg-surface-2 border ${booking.customerPhone.trim() !== "" && !/^(?:\+94|0)\d{9}$/.test(booking.customerPhone.trim()) ? "border-danger focus:border-danger" : "border-border focus:border-accent"} rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all`}
                  />
                  {booking.customerPhone.trim() !== "" && !/^(?:\+94|0)\d{9}$/.test(booking.customerPhone.trim()) && (
                    <p className="text-danger text-xs mt-1.5">Please enter a valid Sri Lankan phone number (e.g., 0771234567).</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                disabled={
                  customerType === "registered"
                    ? !booking.customerId || booking.customerId === "guest"
                    : !booking.customerName.trim() || (booking.customerPhone.trim() !== "" && !/^(?:\+94|0)\d{9}$/.test(booking.customerPhone.trim()))
                }
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
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => setBooking((prev) => ({ ...prev, date: e.target.value }))}
              style={{ colorScheme: "dark" }}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent focus:bg-accent-dim/20 transition-all duration-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-80"
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

        {/* Step 4 — Staff & Time */}
        {step === 4 && <StepAssignStaffAndTime booking={booking} onNext={next} onBack={back} />}

        {/* Step 5 — Confirm */}
        {step === 5 && renderConfirm()}
      </div>
    </div>
  );
}
