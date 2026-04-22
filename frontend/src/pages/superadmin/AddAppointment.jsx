import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddAppointment = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    clientName: "",
    salon: "",
    staff: "",
    service: "",
    dateTime: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Appointment Data:", formData);
    navigate("/Appointments");
  };

  return (
    <div className="page on" id="pg-add-appointment">

      {/* HEADER (Revenue style) */}
      <div className="ph">

        <div className="ph-left">

          <button
            className="back-btn"
            onClick={() => navigate("/Appointments")}
          >
            ←
          </button>

          <div>
            <h1>New Appointment</h1>
            <p>Schedule a new customer booking</p>
          </div>

        </div>

      </div>

      {/* FORM CARD */}
      <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>

        <div className="chdr">
          <h3>Appointment Details</h3>
          <span className="sub">Fill all required fields</span>
        </div>

        <form onSubmit={handleSubmit} className="fc">

          {/* Client Name */}
          <div className="fg">
            <label>Client Name</label>
            <input
              type="text"
              name="clientName"
              placeholder="Enter client name"
              required
              className="pf-inp"
              onChange={handleChange}
            />
          </div>

          {/* Salon */}
          <div className="fg">
            <label>Select Salon</label>
            <select
              name="salon"
              required
              className="pf-inp"
              onChange={handleChange}
            >
              <option value="">Choose Salon...</option>
              <option value="Liyo">Liyo</option>
              <option value="Kathura">Kathura</option>
              <option value="89">89</option>
            </select>
          </div>

          {/* Staff */}
          <div className="fg">
            <label>Assign Staff</label>
            <select
              name="staff"
              required
              className="pf-inp"
              onChange={handleChange}
            >
              <option value="">Choose Staff...</option>
              <option value="Alex Rivera">Alex Rivera</option>
              <option value="Jordan Blake">Jordan Blake</option>
              <option value="Casey Quinn">Casey Quinn</option>
            </select>
          </div>

          {/* Service */}
          <div className="fg">
            <label>Service</label>
            <select
              name="service"
              required
              className="pf-inp"
              onChange={handleChange}
            >
              <option value="">Choose Service...</option>
              <option value="Haircut">Haircut</option>
              <option value="Hair Color">Hair Color</option>
              <option value="Treatment">Treatment</option>
            </select>
          </div>

          {/* Date Time */}
          <div className="fg">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              name="dateTime"
              required
              className="pf-inp"
              onChange={handleChange}
            />
          </div>

          {/* ACTIONS */}
          <div className="mact">

            <button
              type="button"
              className="btn btn-g"
              onClick={() => navigate("/Appointments")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-p"
            >
              Book Appointment
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddAppointment;