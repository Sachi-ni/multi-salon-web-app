import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { getSalons } from "../../services/salonService";
import { getStaff } from "../../services/staffService";
import { getServices } from "../../services/serviceService";
import { createAppointment } from "../../services/bookingService";

const timeSlots = [
  { value: "08:00", label: "08:00 AM" },
  { value: "08:30", label: "08:30 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "09:30", label: "09:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "13:30", label: "01:30 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "14:30", label: "02:30 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "15:30", label: "03:30 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "16:30", label: "04:30 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "17:30", label: "05:30 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "18:30", label: "06:30 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "19:30", label: "07:30 PM" },
  { value: "20:00", label: "08:00 PM" }
];

const AddAppointment = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    clientName: "",
    salon_id: "",
    staff_id: "",
    service_id: "",
    date: "",
    time: "",
    amount: 0
  });

  const [salons, setSalons] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [salonsRes, staffRes, servicesRes] = await Promise.all([
          getSalons(),
          getStaff(),
          getServices()
        ]);
        setSalons(salonsRes.data || []);
        setStaffList(staffRes.data || []);
        setServices(servicesRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load form dependencies from the database.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-resolve base price when service is chosen
      if (name === "service_id") {
        const selectedService = services.find((s) => s._id === value);
        updated.amount = selectedService ? selectedService.base_price : 0;
      }

      // Reset staff selection when salon changes to prevent mismatched bookings
      if (name === "salon_id") {
        updated.staff_id = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const payload = {
        clientName: formData.clientName,
        salon_id: formData.salon_id,
        staff_id: formData.staff_id,
        service_id: formData.service_id,
        amount: formData.amount,
        appointment_date: new Date(`${formData.date}T${formData.time}`),
        scheduled_start_time: formData.time,
        scheduled_end_time: "",
        status: "Pending"
      };

      await createAppointment(payload);
      navigate("/Appointments");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to book appointment");
    }
  };

  // Filter staff by the chosen salon
  const filteredStaff = staffList.filter((s) => {
    const staffSalonId = s.salon_id?._id || s.salon_id || s.salon?._id || s.salon;
    return !formData.salon_id || staffSalonId === formData.salon_id;
  });

  return (
    <div>
      <PageHeader title="New Appointment" subtitle="Schedule a new customer booking" backTo="/Appointments" />

      {error && (
        <div className="flex items-center gap-2 max-w-[650px] mx-auto px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-muted-2 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      <Card className="max-w-[650px] mx-auto" accent>
        <Card.Header>
          <Card.Title>Appointment Details</Card.Title>
          <Card.Subtitle>Fill all required fields</Card.Subtitle>
        </Card.Header>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-accent border-r-2" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Client Name"
              name="clientName"
              placeholder="Enter client name"
              value={formData.clientName}
              required
              onChange={handleChange}
            />

            <div className="mb-3.5">
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Select Salon</label>
              <select
                name="salon_id"
                required
                value={formData.salon_id}
                onChange={handleChange}
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer"
              >
                <option value="">Choose Salon...</option>
                {salons.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-3.5">
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Service</label>
              <select
                name="service_id"
                required
                value={formData.service_id}
                onChange={handleChange}
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer"
              >
                <option value="">Choose Service...</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>{s.service_name} (${s.base_price})</option>
                ))}
              </select>
            </div>

            <div className="mb-3.5">
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Assign Staff</label>
              <select
                name="staff_id"
                required
                value={formData.staff_id}
                onChange={handleChange}
                disabled={!formData.salon_id}
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{!formData.salon_id ? "Choose Salon First..." : "Choose Staff..."}</option>
                {filteredStaff.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input
                label="Appointment Date"
                name="date"
                type="date"
                value={formData.date}
                required
                onChange={handleChange}
              />
              <div className="flex flex-col">
                <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                  Appointment Time
                </label>
                <select
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer"
                >
                  <option value="">Choose Time...</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.amount > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-border flex items-center justify-between text-xs text-white">
                <span className="font-semibold text-muted-2">Total Service Price:</span>
                <span className="text-sm font-black text-accent">${formData.amount}</span>
              </div>
            )}

            <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
              <Button variant="ghost" type="button" onClick={() => navigate("/Appointments")}>Cancel</Button>
              <Button variant="primary" type="submit">Book Appointment</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default AddAppointment;