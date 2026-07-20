import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Edit3, Save, ArrowLeft, LayoutDashboard } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import axios from "axios";

const Profile = () => {
  const { user, logout, setUser, token, login } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      confirmPassword: "",
    });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/auth/user/${user.id}`,
        {
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = {
        ...user,
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        salonName: res.data.salonName,
        role: res.data.role || user.role,
        id: res.data.id || user.id,
        salon_id: res.data.salon_id || user.salon_id,
      };

      if (res.data.token) {
        login(updatedUser, res.data.token);
      } else {
        setUser(updatedUser);
      }

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  const displayRole = (user?.role || "manager").replace("-", " ").toUpperCase();
  const salonLabel = user?.salonName || user?.salon_id || "Salon not assigned";

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="flex items-center justify-between mb-5 gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(`/salon-admin/${user?.salon_id || ""}/adminDashboard`)}>
            Back
          </Button>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            👤 Manager Profile
          </h2>
        </div>
        {!isEditing && (
          <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <Card className="mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-xl bg-accent flex items-center justify-center text-xl font-black text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-[0.95rem] text-white">
              {user?.name || "Salon Manager"}
            </div>
            <div className="text-xs text-muted-2">
              {user?.email || "manager@salonhub.com"}
            </div>
            <div className="mt-1 text-[0.7rem] font-extrabold uppercase tracking-wider text-accent">
              {displayRole}
            </div>
            <div className="text-sm text-white mt-1">
              {salonLabel}
            </div>
            <div className="text-[0.65rem] text-accent font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse-dot" />
              Active
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            readOnly={!isEditing}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly={!isEditing}
          />
          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            readOnly={!isEditing}
          />
          <Input
            label="Salon Name"
            value={salonLabel}
            readOnly
          />

          {isEditing && (
            <>
              <Input
                label="New Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
              />
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </>
          )}

          {isEditing && (
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" icon={Save} loading={loading}>
                Save Changes
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="ghost"
          className="flex-1 justify-center"
          icon={LayoutDashboard}
          onClick={() => navigate(`/salon-admin/${user?.salon_id || ""}/adminDashboard`)}
        >
          Dashboard
        </Button>
        <Button
          variant="danger"
          className="flex-1 justify-center"
          icon={LogOut}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Profile;