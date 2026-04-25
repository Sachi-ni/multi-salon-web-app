import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSalon } from "../../services/salonService";

const AddSalon = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    <div className="page on" id="pg-add-salon">

      {/* HEADER */}
      <div className="ph">

        <div className="ph-left">

          <button
            className="back-btn"
            onClick={() => navigate("/Salons")}
          >
            ←
          </button>

          <div>
            <h1>Add Salon</h1>
            <p>Register a new salon partner</p>
          </div>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-w">
          {error}
        </div>
      )}

      {/* FORM CARD */}
      <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>

        <div className="chdr">
          <h3>Salon Details</h3>
          <span className="sub">Fill all required fields</span>
        </div>

        <form onSubmit={handleSubmit} className="fc">

          {/* Salon Name */}
          <div className="fg">
            <label>Salon Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter salon name"
              className="pf-inp"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Owner Name */}
          <div className="fg">
            <label>Owner Name</label>
            <input
              type="text"
              name="ownerName"
              placeholder="Enter owner name"
              className="pf-inp"
              required
              value={formData.ownerName}
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

          {/* Phone */}
          <div className="fg">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter phone number"
              className="pf-inp"
              required
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div className="fg">
            <label>Address</label>
            <input
              type="text"
              name="location"
              placeholder="Enter address"
              className="pf-inp"
              required
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          {/*About US*/}
          <div className="fg">
            <label>About</label>
            <input
              type="text"
              name="about"
              placeholder="Enter about the salon"
              className="pf-inp"
              required
              value={formData.about}
              onChange={handleChange}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="mact">

            <button
              type="button"
              className="btn btn-g"
              onClick={() => navigate("/Salons")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-p"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Salon"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AddSalon;
