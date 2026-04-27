import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStaff, deleteStaff, updateStaff } from "../../services/staffService";
import { getSalons } from "../../services/salonService";

const Staff = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedSalon, setSelectedSalon] = useState("All Salons");

  const [editStaff, setEditStaff] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, salonsRes] = await Promise.all([getStaff(), getSalons()]);
      setStaffList(staffRes.data || []);
      setSalons(salonsRes.data || []);
    } catch (err) {
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusClass = (status) => {
    return status === "Active" ? "pg" : "py";
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      try {
        await deleteStaff(id);
        fetchData();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      const newStatus = staff.status === "Active" ? "Inactive" : "Active";
      await updateStaff(staff._id, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Update failed");
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const staffName = s.name || "";
    const matchesSearch = staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All Roles" || s.role === selectedRole;
    const salonName = (typeof s.salon === 'object' ? s.salon?.name : s.salonName) || "";
    const matchesSalon = selectedSalon === "All Salons" || salonName === selectedSalon;
    
    return matchesSearch && matchesRole && matchesSalon;
  });

  return (
    <div className="page on" id="pg-staff">

      {/* HEADER */}
      <div className="ph">

        <div className="ph-left">
          <button className="back-btn" onClick={() => navigate("/superAdminDashboard")}>
            ←
          </button>
          <div>
            <h1>Staff</h1>
            <p>All staff across all salons</p>
          </div>
        </div>

        <div className="pactions">

          <button
            className="btn btn-p"
            onClick={() => navigate("/AddStaff")}
          >
            + Add Staff
          </button>

        </div>

      </div>

      {/* FILTER BAR */}
      <div className="fb">

        <div className="srch">

          <svg className="i" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.3-4.3"></path>
          </svg>

          <input 
            placeholder="Search staff..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </div>

        <select 
          className="fsel" 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option>All Roles</option>
          {Array.from(new Set(staffList.map(s => s.role))).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        <select 
          className="fsel"
          value={selectedSalon}
          onChange={(e) => setSelectedSalon(e.target.value)}
        >
          <option>All Salons</option>
          {salons.map(s => (
            <option key={s._id} value={s.name}>{s.name}</option>
          ))}
        </select>

      </div>

      {/* TABLE */}
      <div className="tw">

        <table>

          <thead>

            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Salon</th>
              <th>Status</th>
              <th>Bookings</th>
              <th>Rating</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (
              <tr><td colSpan="7">Loading...</td></tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="7">No staff found</td>
              </tr>
            ) : (
              filteredStaff.map((s) => (
                <tr key={s._id}>

                  <td style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700 }}>

                    <div className="av" style={{ background: "var(--s2)" }}>
                      {s.name ? s.name.split(" ").map(n => n[0]).join("") : "S"}
                    </div>

                    {s.name}

                  </td>

                  <td>
                    <span className="pill pb">
                      {s.role}
                    </span>
                  </td>

                  <td style={{ color: "var(--muted2)" }}>
                    {s.salon?.name || s.salonName || "-"}
                  </td>

                  <td>
                    <span className={`pill ${getStatusClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>

                  <td>{s.bookings || 0}</td>

                  <td style={{ color: "var(--yellow)" }}>
                    ⭐ {s.rating || "0.0"}
                  </td>

                  <td style={{ textAlign: "right" }}>

                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>

                      <button className="btn btn-s xs" onClick={() => handleToggleStatus(s)}>
                        {s.status === "Active" ? "Deactivate" : "Activate"}
                      </button>

                      <button className="btn btn-d xs" onClick={() => handleDelete(s._id)}>
                        Remove
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Staff;

