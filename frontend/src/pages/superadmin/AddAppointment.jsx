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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Appointment Data:", formData);
    // Logic for saving to MongoDB will go here
    navigate("/Appointments");
  };

  return (
    <div id="pg-add-appointment" style={{ padding: "20px", color: "#000" }}>
      <div className="ph" style={{ marginBottom: "20px" }}>
        <h1 style={{ color: "#fff" }}>Schedule New Appointment</h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", border: "2px solid #000", backgroundColor: "#d1d1d1" }}>
        {/* Header */}
        <div style={{ padding: "15px", borderBottom: "2px solid #000", textAlign: "center", fontWeight: "bold", fontSize: "1.2rem" }}>
          New Appointment Details
        </div>

        {/* Form Rows */}
        <form onSubmit={handleSubmit}>
          {/* Client Name Input */}
          <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              Client Name
            </div>
            <div style={{ width: "60%" }}>
              <input 
                type="text" 
                required
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", outline: "none" }} 
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              />
            </div>
          </div>

          {/* Salon Selection */}
          <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              Select Salon
            </div>
            <div style={{ width: "60%" }}>
              <select 
                required
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", outline: "none" }}
                onChange={(e) => setFormData({...formData, salon: e.target.value})}
              >
                <option value="">Choose Salon...</option>
                <option value="Liyo">Liyo</option>
                <option value="Kathura">Kathura</option>
                <option value="89">89</option>
              </select>
            </div>
          </div>

          {/* Staff Selection */}
          <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              Assign Staff
            </div>
            <div style={{ width: "60%" }}>
              <select 
                required
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", outline: "none" }}
                onChange={(e) => setFormData({...formData, staff: e.target.value})}
              >
                <option value="">Choose Staff...</option>
                <option value="Alex Rivera">Alex Rivera</option>
                <option value="Jordan Blake">Jordan Blake</option>
                <option value="Casey Quinn">Casey Quinn</option>
              </select>
            </div>
          </div>

          {/* Service Selection */}
          <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              Service
            </div>
            <div style={{ width: "60%" }}>
              <select 
                required
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", outline: "none" }}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
              >
                <option value="">Choose Service...</option>
                <option value="Haircut">Haircut</option>
                <option value="Hair Color">Hair Color</option>
                <option value="Treatment">Treatment</option>
              </select>
            </div>
          </div>

          {/* Date and Time Picker */}
          <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              Date & Time
            </div>
            <div style={{ width: "60%" }}>
              <input 
                type="datetime-local" 
                required
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", outline: "none" }} 
                onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
              />
            </div>
          </div>

          {/* Save Button Row */}
          <div style={{ padding: "15px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button 
              type="button"
              onClick={() => navigate("/Appointments")}
              style={{ backgroundColor: "#888", color: "#fff", border: "none", padding: "10px 25px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{ backgroundColor: "#00c875", color: "#fff", border: "none", padding: "10px 40px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}
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