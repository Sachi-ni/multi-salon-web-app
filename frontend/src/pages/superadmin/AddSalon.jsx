import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSalon } from "../../services/salonService";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const AddSalon = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    about: "",
    status: "Active",
    managerName: "",
    managerEmail: "",
    managerPhone: "",
    managerPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createSalon(formData);
      navigate("/Salons");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create salon");
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

        <form onSubmit={handleSubmit}>
          <Input label="Salon Name" name="name" placeholder="Enter salon name" required value={formData.name} onChange={handleChange} />
          <Input label="Email" name="email" type="email" placeholder="Enter email" required value={formData.email} onChange={handleChange} />
          <Input label="Phone" name="phone" placeholder="Enter phone number" required value={formData.phone} onChange={handleChange} />
          <Input label="Address" name="location" placeholder="Enter address" required value={formData.location} onChange={handleChange} />
          <Input label="About" name="about" placeholder="Enter about the salon" required value={formData.about} onChange={handleChange} />

          <div className="mb-4">
            <label className="block text-xs font-bold text-muted-2 uppercase tracking-wider mb-1.5">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          <div className="mt-8 mb-3.5 border-t border-border pt-6">
            <h2 className="text-lg font-bold text-white mb-3">Salon Manager Details</h2>
            <Input label="Manager Name" name="managerName" placeholder="Enter manager full name" required value={formData.managerName} onChange={handleChange} />
            <Input label="Manager Email" name="managerEmail" type="email" placeholder="Enter manager email" required value={formData.managerEmail} onChange={handleChange} />
            <Input label="Manager Phone" name="managerPhone" placeholder="Enter manager phone" required value={formData.managerPhone} onChange={handleChange} />
            <Input label="Manager Password" name="managerPassword" type="password" placeholder="Enter manager password" required value={formData.managerPassword} onChange={handleChange} />
          </div>

          <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => navigate("/Salons")} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" loading={loading}>{loading ? "Adding..." : "Add Salon"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddSalon;
