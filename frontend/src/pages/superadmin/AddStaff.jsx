import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../../constants/roles";
import { createStaff } from "../../services/staffService";
import { getSalons } from "../../services/salonService";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useParams } from "react-router-dom";

const AddStaff = () => {
  const navigate = useNavigate();
  const { salonId } = useParams();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", role: "", 
    salon: salonId || "", picture: null,
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", `${formData.firstName} ${formData.lastName}`);
      data.append("email", formData.email);
      data.append("role", formData.role);
      data.append("salonId", formData.salon);
      if (formData.picture) data.append("image", formData.picture);
      await createStaff(data);
      navigate("/Staff");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add staff");
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

        <form onSubmit={handleSubmit}>
          <Input label="First Name" name="firstName" placeholder="Enter first name" required value={formData.firstName} onChange={handleChange} />
          <Input label="Last Name" name="lastName" placeholder="Enter last name" required value={formData.lastName} onChange={handleChange} />
          <Input label="Email" name="email" type="email" placeholder="Enter email" required value={formData.email} onChange={handleChange} />

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Role</label>
            <select
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer"
            >
              <option value="">Select Role...</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Salon</label>
            <select
              name="salon"
              required
              value={formData.salon}
              onChange={handleChange}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-accent cursor-pointer"
            >
              <option value="">Select Salon...</option>
              {salons.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, picture: e.target.files[0] })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-accent file:text-primary file:cursor-pointer"
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