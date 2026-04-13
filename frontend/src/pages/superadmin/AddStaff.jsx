import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddStaff = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", role: "", salon: "", picture: null
  });

  return (
    <div id="pg-add-staff" style={{ padding: "20px", color: "#000" }}>
      <div className="ph" style={{ marginBottom: "20px" }}>
        <h1 style={{ color: "#fff" }}>Add New Staff</h1>
      </div>

      <div style={{ maxWidth: "500px", margin: "0 auto", border: "2px solid #000", backgroundColor: "#d1d1d1" }}>
        {/* Header */}
        <div style={{ padding: "15px", borderBottom: "2px solid #000", textAlign: "center", fontWeight: "bold", fontSize: "1.2rem" }}>
          Add Staff
        </div>

        {/* Form Rows */}
        {[
          { label: "First Name", name: "firstName" },
          { label: "Last Name", name: "lastName" },
          { label: "Email", name: "email" },
          { label: "Role", name: "role" },
          { label: "Salon", name: "salon" }
        ].map((field) => (
          <div key={field.name} style={{ display: "flex", borderBottom: "2px solid #000" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
              {field.label}
            </div>
            <div style={{ width: "60%" }}>
              <input 
                type="text" 
                style={{ width: "100%", background: "transparent", border: "none", padding: "12px", outline: "none" }} 
                onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
              />
            </div>
          </div>
        ))}

        {/* Picture Upload Row */}
        <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
          <div style={{ width: "40%", padding: "12px", borderRight: "2px solid #000", fontWeight: "bold", textAlign: "center" }}>
            Picture
          </div>
          <div style={{ width: "60%", padding: "8px", display: "flex", justifyContent: "center" }}>
            <button style={{ backgroundColor: "#6211ee", color: "#fff", border: "none", padding: "8px 25px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "bold" }}>
              <span>⬆</span> Upload
            </button>
          </div>
        </div>

        {/* Save Button Row */}
        <div style={{ padding: "15px", display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={() => { console.log(formData); navigate("/Staff"); }}
            style={{ backgroundColor: "#00c875", color: "#fff", border: "none", padding: "10px 40px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStaff;