import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createStaff } from "../../services/staffService";
import { getSalons } from "../../services/salonService";
import { getServices } from "../../services/serviceService";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useParams } from "react-router-dom";

const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]);
const PHONE_PATTERN = /^(?:\+94|0)\d{9}$/;
const COMMON_PASSWORDS = new Set(["123456", "12345678", "password", "password123", "qwerty"]);

const normalizePhone = (phone) => phone.trim().replace(/[\s()-]/g, "");

const validateStaffForm = (formData) => {
  const email = formData.email.trim().toLowerCase();
  const phone = normalizePhone(formData.phone);

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  if (!EMAIL_DOMAINS.has(email.split("@")[1])) {
    return "Email must use Gmail, Yahoo, Outlook, or Hotmail (for example, staff@gmail.com).";
  }

  if (!PHONE_PATTERN.test(phone)) {
    return "Enter a valid Sri Lankan phone number (for example, 0771234567 or +94771234567).";
  }

  const password = formData.password;
  const isStrongPassword =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*]/.test(password);

  if (!isStrongPassword || COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
  }

  return "";
};

const AddStaff = () => {
  const navigate = useNavigate();
  const { salonId } = useParams();
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "",
    phone: "",
    salon: salonId || "", services: [], picture: null,
    salaryPaymentFrequency: "monthly",
    salaryPaymentCountPerDay: 1,
  });

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const res = await getSalons();
        setSalons(res.data || []);
      } catch (err) {
        console.error("Failed to load salons");
      }
    };
    fetchSalons();
  }, []);

  useEffect(() => {
    if (!formData.salon) {
      setServices([]);
      setFormData((current) => ({ ...current, services: [] }));
      return;
    }

    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const res = await getServices(formData.salon);
        setServices(res.data || []);
      } catch (err) {
        console.error("Failed to load services");
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, [formData.salon]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSalonChange = (e) => {
    setFormData({ ...formData, salon: e.target.value, services: [] });
  };

  const handleServiceToggle = (serviceId) => {
    setFormData((current) => {
      const isSelected = current.services.includes(serviceId);
      return {
        ...current,
        services: isSelected
          ? current.services.filter((id) => id !== serviceId)
          : [...current.services, serviceId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateStaffForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("firstName", formData.firstName.trim());
      data.append("lastName", formData.lastName.trim());
      data.append("email", formData.email.trim().toLowerCase());
      data.append("phone", normalizePhone(formData.phone));
      data.append("password", formData.password);
      data.append("salonId", formData.salon);
      data.append("salaryPaymentFrequency", formData.salaryPaymentFrequency);
      data.append("salaryPaymentCountPerDay", formData.salaryPaymentCountPerDay);
      data.append("services", JSON.stringify(formData.services));
      if (formData.picture) data.append("image", formData.picture);
      await createStaff(data);
      // Navigate back to Salons page to show updated staffCount
      navigate("/Salons", { state: { refreshData: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Staff" subtitle="Create a new staff member profile" backTo="/Staff" />

      <Card className="max-w-[600px] mx-auto" accent>
        <Card.Header>
          <Card.Title>Staff Details</Card.Title>
          <Card.Subtitle>Fill all required fields</Card.Subtitle>
        </Card.Header>

        {error && (
          <div className="px-4 py-3 mb-4 rounded-lg bg-danger-dim border border-danger-border text-sm text-danger font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <Input label="First Name" name="firstName" placeholder="Enter first name" required value={formData.firstName} onChange={handleChange} />
          <Input label="Last Name" name="lastName" placeholder="Enter last name" required value={formData.lastName} onChange={handleChange} />
          <Input label="Email" name="email" type="email" placeholder="Enter email" required value={formData.email} onChange={handleChange} />
          <Input
            label="Phone"
            name="phone"
            placeholder="0771234567 or +94771234567"
            required
            value={formData.phone}
            onChange={handleChange}
            pattern="(?:\\+94|0)[0-9]{9}"
            title="Use 0771234567 or +94771234567"
          />
          <Input label="Password" name="password" type="password" placeholder="Enter password" required minLength={8} value={formData.password} onChange={handleChange} />

          <div className="mb-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                  Payment Frequency
                  <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">
                    (required)
                  </span>
                </label>
                <select
                  name="salaryPaymentFrequency"
                  value={formData.salaryPaymentFrequency}
                  onChange={handleChange}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                  Salary Amount Per Day (LKR)
                  <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">
                    (required)
                  </span>
                </label>
                <input
                  type="number"
                  name="salaryPaymentCountPerDay"
                  min="1"
                  value={formData.salaryPaymentCountPerDay}
                  onChange={handleChange}
                  placeholder="Enter daily salary amount"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Salon <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span></label>
            <select
              name="salon"
              required
              value={formData.salon}
              onChange={handleSalonChange}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer"
            >
              <option value="">Select Salon...</option>
              {salons.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Services <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span></label>
            <div className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3">
              {!formData.salon ? (
                <p className="text-xs text-muted-2">Select a salon to choose services.</p>
              ) : servicesLoading ? (
                <p className="text-xs text-muted-2">Loading services...</p>
              ) : services.length === 0 ? (
                <p className="text-xs text-muted-2">No services found for this salon.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {services.map((service) => (
                    <label
                      key={service._id}
                      className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2 text-sm text-white cursor-pointer hover:border-accent/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service._id)}
                        onChange={() => handleServiceToggle(service._id)}
                        className="h-4 w-4 accent-yellow-400"
                      />
                      <span className="truncate">{service.service_name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Profile Picture <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span></label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, picture: e.target.files[0] })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-accent file:text-primary file:cursor-pointer"
              required
            />
          </div>

          <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => navigate("/Staff")}>Cancel</Button>
            <Button variant="primary" type="submit" loading={loading}>{loading ? "Saving..." : "Save Staff"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddStaff;
