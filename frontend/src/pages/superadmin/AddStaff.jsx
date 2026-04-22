import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddStaff = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    salon: "",
    picture: null
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Staff:", formData);

    navigate("/Staff");
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

          {/* Role */}
          <div className="fg">
            <label>Role</label>
            <input
              type="text"
              name="role"
              placeholder="e.g. Hair Stylist"
              className="pf-inp"
              required
              onChange={handleChange}
            />
          </div>

          {/* Salon */}
          <div className="fg">
            <label>Salon</label>
            <select
              name="salon"
              className="pf-inp"
              required
              onChange={handleChange}
            >
              <option value="">Select Salon...</option>
              <option value="Liyo">Liyo</option>
              <option value="Kathura">Kathura</option>
              <option value="89">89</option>
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
            >
              Save Staff
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddStaff;