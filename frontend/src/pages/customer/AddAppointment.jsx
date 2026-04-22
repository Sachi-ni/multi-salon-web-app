import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- MOCK DATA (ERD Tables) ---
const MOCK_BRANCHES = [
  { id: 1, name: "Liyo", location: "City Center" },
  { id: 2, name: "Kathura", location: "Main Street" },
  { id: 3, name: "89", location: "Uptown" }
];

const MOCK_SERVICES = [
  { id: 101, name: "Haircut", price: 50 },
  { id: 102, name: "Hair Color", price: 80 },
  { id: 103, name: "Treatment", price: 60 }
];

const MOCK_STAFF = [
  { id: 501, name: "Alex Rivera", branchId: 1 }, // Liyo
  { id: 502, name: "Jordan Blake", branchId: 2 }, // Kathura
  { id: 503, name: "Casey Quinn", branchId: 3 }  // 89
];

const AddAppointment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientName: "",
    salonId: "",
    staffId: "",
    serviceId: "",
    dateTime: ""
  });

  // --- Filter Logic ---
  // Only show staff who work at the selected salon
  const filteredStaff = MOCK_STAFF.filter(
    (s) => s.branchId === parseInt(formData.salonId)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saving Appointment to MongoDB Logic...", formData);
    alert("Appointment Booked Successfully!");
    navigate("/");
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

        <form onSubmit={handleSubmit}>
          {/* Client Name */}
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

          {/* Salon Selection (Triggers filtering) */}
          <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              Select Salon
            </div>
            <div style={{ width: "60%" }}>
              <select 
                required
                value={formData.salonId}
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", outline: "none" }}
                onChange={(e) => setFormData({...formData, salonId: e.target.value, staffId: ""})} // Reset staff when salon changes
              >
                <option value="">Choose Salon...</option>
                {MOCK_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          {/* Staff Selection (Depends on Salon) */}
          <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              Assign Staff
            </div>
            <div style={{ width: "60%" }}>
              <select 
                required
                disabled={!formData.salonId}
                value={formData.staffId}
                style={{ width: "100%", background: formData.salonId ? "transparent" : "#bbb", border: "none", padding: "12px", outline: "none" }}
                onChange={(e) => setFormData({...formData, staffId: e.target.value})}
              >
                <option value="">{formData.salonId ? "Choose Staff..." : "Select a Salon first"}</option>
                {filteredStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
              >
                <option value="">Choose Service...</option>
                {MOCK_SERVICES.map(sv => <option key={sv.id} value={sv.id}>{sv.name} (${sv.price})</option>)}
              </select>
            </div>
          </div>

          {/* Date and Time */}
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

          {/* Buttons */}
          <div style={{ padding: "15px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button 
              type="button"
              onClick={() => navigate("/customer")}
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