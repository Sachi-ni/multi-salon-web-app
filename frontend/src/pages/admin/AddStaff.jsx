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

const AddStaff = () => {
  const navigate = useNavigate();
  const { salonId } = useParams();
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picturePreview, setPicturePreview] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    salon: salonId,
    services: [],
    picture: null,
    salaryPaymentFrequency: "monthly",
    salaryPaymentCountPerDay: 1,
    salaryBalance: 0,
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

  const handlePictureChange = (file) => {
    if (picturePreview) {
      URL.revokeObjectURL(picturePreview);
    }

    if (!file) {
      setPicturePreview("");
      setFormData({ ...formData, picture: null });
      return;
    }

    setPicturePreview(URL.createObjectURL(file));
    setFormData({ ...formData, picture: file });
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

  const staffPageUrl = `/salon-admin/${formData.salon || salonId}/adminStaff`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", `${formData.firstName} ${formData.lastName}`);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("salonId", formData.salon);
      data.append("salaryPaymentFrequency", formData.salaryPaymentFrequency);
      data.append("salaryPaymentCountPerDay", formData.salaryPaymentCountPerDay);
      data.append("salaryBalance", formData.salaryBalance);

      formData.services.forEach((serviceId) => {
        data.append("services", serviceId);
      });
      if (formData.picture) data.append("image", formData.picture);
      await createStaff(data);
      navigate(`/salon-admin/${formData.salon}/adminStaff`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  const selectedSalon = salons.find(
    (s) => s._id === formData.salon
  );

  useEffect(() => {
    return () => {
      if (picturePreview) {
        URL.revokeObjectURL(picturePreview);
      }
    };
  }, [picturePreview]);


  return (
    <div>
      <PageHeader
        title="Add Staff"
        subtitle="Create a new staff member profile"
        backTo={staffPageUrl}
      />
      <Card className="max-w-[600px] mx-auto" accent>
        <Card.Header>
          <Card.Title>Staff Details</Card.Title>
          <Card.Subtitle>Fill all required fields</Card.Subtitle>
        </Card.Header>

        <form onSubmit={handleSubmit} autoComplete="off">
          <Input label="First Name" name="firstName" placeholder="Enter first name" required value={formData.firstName} onChange={handleChange} autoComplete="new-name" />
          <Input label="Last Name" name="lastName" placeholder="Enter last name" required value={formData.lastName} onChange={handleChange} autoComplete="new-name" />
          <Input label="Email" name="email" type="email" placeholder="Enter email" required value={formData.email} onChange={handleChange} autoComplete="new-email" />
          <Input label="Password" name="password" type="password" placeholder="Enter password" required value={formData.password} onChange={handleChange} autoComplete="new-password" />

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

            <div className="mt-4">
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Balance (LKR)
                <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">
                  (optional)
                </span>
              </label>
              <input
                type="number"
                name="salaryBalance"
                min="0"
                value={formData.salaryBalance}
                onChange={handleChange}
                placeholder="Enter initial balance"
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent"
              />
            </div>
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Salon <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
            </label>

            <div className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white">
              {selectedSalon?.name || "Loading..."}
            </div>
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
              onChange={(e) => handlePictureChange(e.target.files?.[0] || null)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-accent file:text-primary file:cursor-pointer"
              required
            />
            {picturePreview && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
                <img
                  src={picturePreview}
                  alt="Selected staff preview"
                  className="h-16 w-16 rounded-lg object-cover border border-border"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Preview</p>
                  <p className="text-2xs text-neutral-400 truncate">The selected photo will be uploaded with the staff profile.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate(staffPageUrl)}
            >
              Cancel
            </Button>

            <Button variant="primary" type="submit" loading={loading}>{loading ? "Saving..." : "Save Staff"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddStaff;
