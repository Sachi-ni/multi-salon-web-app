import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSalon } from "../../services/salonService";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import useFormValidation from "../../hooks/useFormValidation";
import { validateEmail, validatePassword, validatePhoneSriLankan } from "../../utils/validation";

const TIME_SLOTS = [];
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, "0");
  TIME_SLOTS.push(`${hour}:00`);
  TIME_SLOTS.push(`${hour}:30`);
}

const AddSalon = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    about: "",
    managerName: "",
    managerEmail: "",
    managerPhone: "",
    managerPassword: "",
    open_time: "",
    close_time: ""
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSubmitError, setEmailSubmitError] = useState("");
  const { errors, handleBlur, validateAll, isValid, fieldMessages } = useFormValidation(formData, {
    phone: validatePhoneSriLankan,
    managerEmail: validateEmail,
    managerPhone: validatePhoneSriLankan,
    managerPassword: validatePassword,
  });

  const handleChange = (e) => {
    if (e.target.name === "managerEmail") setEmailSubmitError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailSubmitError("");

    if (!validateAll()) {
      setLoading(false);
      return;
    }

    if (formData.open_time && formData.close_time && formData.open_time >= formData.close_time) {
      setError("Opening time must be earlier than closing time.");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (logo) data.append("logo", logo);
      await createSalon(data);
      navigate("/Salons", { state: { refreshData: true } });
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to create salon";
      if (/email/i.test(message)) setEmailSubmitError(message);
      else setError(message);
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Salon" subtitle="Register a new salon partner" backTo="/Salons" />

      {error && (
        <div className="px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          {error}
        </div>
      )}

      <Card className="max-w-[650px] mx-auto" accent>
        <Card.Header>
          <Card.Title>Salon Details</Card.Title>
          <Card.Subtitle>Fill all required fields</Card.Subtitle>
        </Card.Header>

        <form onSubmit={handleSubmit} autoComplete="off">
          <Input label="Salon Name" name="name" placeholder="Enter salon name" required value={formData.name} onChange={handleChange} />
          <Input label="Phone" name="phone" placeholder="0771234567 or +94771234567" required value={formData.phone} onChange={handleChange} onBlur={() => handleBlur("phone")} error={errors.phone} />
          <Input label="Address" name="location" placeholder="Enter address" required value={formData.location} onChange={handleChange} />
<Input label="About" name="about" placeholder="Enter about the salon" value={formData.about} onChange={handleChange} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3.5">
            <div>
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Opening Time
              </label>
              <select
                name="open_time"
                value={formData.open_time}
                onChange={handleChange}
                required
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="" disabled>Select opening time</option>
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Closing Time
              </label>
              <select
                name="close_time"
                value={formData.close_time}
                onChange={handleChange}
                required
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="" disabled>Select closing time</option>
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Salon Logo Upload */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Salon Logo <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border overflow-hidden flex-shrink-0">
                  <img src={logoPreview} alt="Salon logo preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted-2 flex-shrink-0">
                  <span className="text-2xl font-black">S</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-accent file:text-primary file:cursor-pointer"
              />
            </div>
            <p className="text-[0.6rem] text-muted-2 mt-1">Upload a logo for this salon. It will appear in the manager header and salon directory.</p>
          </div>

          <div className="mt-8 mb-3.5 border-t border-border pt-6">
            <h2 className="text-lg font-bold text-white mb-3">Salon Manager Details</h2>
            <Input label="Manager Name" name="managerName" placeholder="Enter manager full name" required value={formData.managerName} onChange={handleChange} />
            <Input label="Manager Email" name="managerEmail" type="email" placeholder="Enter manager email" required value={formData.managerEmail} onChange={handleChange} onBlur={() => handleBlur("managerEmail")} error={errors.managerEmail || emailSubmitError} helper={fieldMessages.managerEmail} />
            <Input label="Manager Phone" name="managerPhone" placeholder="0771234567 or +94771234567" required value={formData.managerPhone} onChange={handleChange} onBlur={() => handleBlur("managerPhone")} error={errors.managerPhone} />
            <Input label="Manager Password" name="managerPassword" type="password" placeholder="Enter manager password" required value={formData.managerPassword} onChange={handleChange} onBlur={() => handleBlur("managerPassword")} error={errors.managerPassword} />
          </div>

          <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => navigate("/Salons")} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" loading={loading} disabled={loading || !isValid}>{loading ? "Adding..." : "Add Salon"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddSalon;
