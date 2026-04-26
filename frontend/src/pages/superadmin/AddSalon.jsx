import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddSalon = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    salonName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Salon:", formData);

    // later: API call here

    navigate("/Salons");
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
              name="salonName"
              placeholder="Enter salon name"
              className="pf-inp"
              required
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
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div className="fg">
            <label>Address</label>
            <input
              type="text"
              name="address"
              placeholder="Enter address"
              className="pf-inp"
              required
              onChange={handleChange}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="mact">

            <button
              type="button"
              className="btn btn-g"
              onClick={() => navigate("/Salons")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-p"
            >
              Add Salon
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddSalon;