import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../../constants/roles";
import { createStaff } from "../../services/staffService";
import { getSalons } from "../../services/salonService";

const AddStaff = () => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    salon: "",
    picture: null
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      if (formData.picture) {
        data.append("image", formData.picture);
      }

      await createStaff(data);
      navigate("/Staff");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page on" id="pg-add-staff">

      {/* HEADER */}
      <div className="ph">

        <div className="ph-left">

          <button
            className="back-btn"
            onClick={() => navigate("/Staff")}
          >
            ←
          </button>

          <div>
            <h1>Add Staff</h1>
            <p>Create a new staff member profile</p>
          </div>

        </div>

      </div>

      {/* FORM CARD */}
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>

        <div className="chdr">
          <h3>Staff Details</h3>
          <span className="sub">Fill all required fields</span>
        </div>

        <form onSubmit={handleSubmit} className="fc">

          {/* First Name */}
          <div className="fg">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="Enter first name"
              className="pf-inp"
              required
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          {/* Last Name */}
          <div className="fg">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Enter last name"
              className="pf-inp"
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="fg">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              className="pf-inp"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>


          {/* Role */}
          <div className="fg">
            <label>Role</label>
            <select
              name="role"
              className="pf-inp"
              required
              onChange={handleChange}
              value={formData.role}
            >
              <option value="">Select Role...</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Salon */}
          <div className="fg">
            <label>Salon</label>
            <select
              name="salon"
              className="pf-inp"
              required
              value={formData.salon}
              onChange={handleChange}
            >
              <option value="">Select Salon...</option>
              {salons.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Picture Upload */}
          <div className="fg">
            <label>Profile Picture</label>

            <input
              type="file"
              className="pf-inp"
              accept="image/*"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  picture: e.target.files[0]
                })
              }
            />
          </div>

          {/* ACTIONS */}
          <div className="mact">

            <button
              type="button"
              className="btn btn-g"
              onClick={() => navigate("/Staff")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-p"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Staff"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddStaff;