import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { X, Camera } from "lucide-react";
import axios from "axios";
import { API_BASE, API_URL } from "../../config";

const Edit = () => {
  const { user, setUser, token, login } = useAuth();
  const navigate = useNavigate();

  const [fname, setFname] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(
    user?.image
      ? user.image.startsWith("http")
        ? user.image
        : `${API_BASE}/${user.image.replace(/\\/g, "/")}`
      : ""
  );
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    const passwordIsStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
    const emailIsValid = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{3,63}$/.test(email.trim());
    const phoneIsValid = !normalizedPhone || /^\+?[0-9]{10}$/.test(normalizedPhone);

    if (!emailIsValid) {
      alert("Please enter a valid email address");
      return;
    }
    if (!phoneIsValid) {
      alert("Phone number must contain exactly 10 digits and may start with +");
      return;
    }
    if (password && !passwordIsStrong) {
      alert("Password must be at least 6 characters and include uppercase, lowercase, and number");
      return;
    }
    if (password && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("full_name", fname);
      formData.append("email", email.trim().toLowerCase());
      formData.append("phone", normalizedPhone);
      formData.append("username", username);
      if (password) formData.append("password", password);
      if (image) formData.append("image", image);

      const res = await axios.put(
        `${API_URL}/auth/user/${user.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update context + localStorage and refresh token if provided
      const updatedUser = {
        ...user,
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        username: res.data.username,
        image: res.data.image || user.image,
      };

      // If backend returned a new token, use login to sync both user + token
      if (res.data.token) {
        login(updatedUser, res.data.token);
      } else {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      alert("Profile updated successfully!");
      if (user?.role === "customer" || user?.role === "user") {
        navigate("/customer/dashboard");
      } else if (user?.role === "super-admin") {
        navigate("/Profile");
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-[1000] grid-bg py-4">
      <div className="relative z-10 w-[460px] max-w-[96vw] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-modal">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent-hover rounded-t-2xl" />

        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-base font-black text-primary flex-shrink-0">
            S
          </div>
          <span className="text-xl font-black text-accent tracking-tight">SalonHub</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-6">Edit Profile</h1>

<form onSubmit={handleUpdate}>
          {/* Profile Picture */}
          <div className="mb-5 flex items-center gap-4">
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-accent/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-accent-dim border-2 border-accent/40 flex items-center justify-center text-accent font-black text-xl">
                  {(user?.name || "S").charAt(0).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="profile-image"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-accent text-primary flex items-center justify-center cursor-pointer hover:bg-accent-hover transition-colors shadow-sm"
                title="Change photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
            </div>
            <div className="flex-1">
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Profile Picture
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-xs text-muted-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-accent file:text-primary file:cursor-pointer cursor-pointer"
              />
              <p className="text-[0.6rem] text-muted mt-1">Upload a new photo to update your profile picture.</p>
            </div>
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          {user?.role !== "customer" && user?.role !== "user" && (
            <div className="mb-3.5">
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
              />
            </div>
          )}

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              pattern="\\+?[0-9\\s()\-]{10,20}"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9+\s()-]/g, "");
                if (value.replace(/[\s()-]/g, "").replace(/^\+/, "").length <= 10) setPhone(value);
              }}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Password
            </label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

<button
            className="w-full mt-1.5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-glow hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={uploading}
          >
            {uploading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Edit;
