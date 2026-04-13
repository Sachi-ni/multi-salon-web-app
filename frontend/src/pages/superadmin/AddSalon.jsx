import React from "react";

const AddSalon = () => {
  return (
    <div id="pg-add-salon">
      <div className="ph">
        <div>
          <h1>Add New Salon</h1>
          <p id="dgreet">Enter the details of the new salon partner</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "600px", margin: "0 auto", padding: "0" }}>
        {/* Header of the table */}
        <div style={{ padding: "15px", borderBottom: "1px solid #444", textAlign: "center", fontWeight: "bold" }}>
          Add/Edit New Salon
        </div>

        {/* Form Grid */}
        {[
          "Salon Name",
          "Owner Name",
          "Email",
          "Phone",
          "Address"
        ].map((label) => (
          <div key={label} style={{ display: "flex", borderBottom: "1px solid #444" }}>
            <div style={{ width: "40%", padding: "12px", borderRight: "1px solid #444", color: "var(--muted2)" }}>
              {label}
            </div>
            <div style={{ width: "60%" }}>
              <input 
                type="text" 
                style={{ width: "100%", background: "transparent", border: "none", color: "#fff", padding: "12px", outline: "none" }} 
              />
            </div>
          </div>
        ))}

        {/* Action Button */}
        <div style={{ padding: "20px", textAlign: "center" }}>
          <button className="btn btn-p" style={{ padding: "10px 40px" }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSalon;