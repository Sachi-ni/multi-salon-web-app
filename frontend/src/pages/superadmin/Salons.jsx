import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSalons, getSalon, updateSalon, deleteSalon } from "../../services/salonService";

const Salons = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salonList, setSalonList] = useState([]);

  const [viewSalon, setViewSalon] = useState(null);
  const [editSalon, setEditSalon] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSalons();
      setSalonList(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load salons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleView = (id) => {
    navigate(`/admin/dashboard/${id}`);
  };

  const handleEditOpen = async (id) => {
    try {
      const res = await getSalon(id);
      setEditSalon(res.data);
      setEditForm(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load salon for editing");
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateSalon(editSalon._id, editForm);
      setEditSalon(null);
      await fetchSalons();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update salon");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteSalon(deleteId);
      setDeleteId(null);
      await fetchSalons();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete salon");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSortByName = () => {
    const sorted = [...salonList].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";

      if (sortAsc) {
        return nameA > nameB ? 1 : -1; // A-Z
      } else {
        return nameA < nameB ? 1 : -1; // Z-A
      }
    });

    setSalonList(sorted);
    setSortAsc(!sortAsc);
  };

  return (
    <div className="page on" id="pg-salons">

      <div className="ph">
        <div className="ph-left">
          <button className="back-btn" onClick={() => navigate("/Dashboard")}>
            ←
          </button>
          <div>
            <h1>Salons</h1>
            <p>All registered salon locations</p>
          </div>
        </div>
        <div className="pactions">
          <button className="btn btn-p" onClick={() => navigate("/AddSalon")}>
            + Add Salon
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-w">
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "10px", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading salons...</p>
      ) : (
        <>
          <div className="rev-tbl-hdr">
            <h3>Salon Directory</h3>
            <button className="sort-btn" onClick={handleSortByName}>Sort by name {sortAsc ? "▲" : "▼"}</button>
          </div>

          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Salon</th>
                  <th>Owner</th>
                  <th>Revenue</th>
                  <th>Staff</th>
                  <th>Created</th>
                  <th>Address</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salonList.length === 0 ? (
                  <tr>
                    <td colSpan="7">No salons found</td>
                  </tr>
                ) : (
                  salonList.map((salon) => (
                    <tr key={salon._id}>
                      <td style={{ fontWeight: 700 }}>{salon.name}</td>
                      <td>{salon.ownerName || "-"}</td>
                      <td style={{ color: "var(--yellow)" }}>
                        Rs. {salon.revenue ? salon.revenue.toLocaleString() : "0"}
                      </td>
                      <td>{salon.staffCount || 0}</td>
                      <td>{formatDate(salon.createdAt)}</td>
                      <td>{salon.location || "-"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button className="btn btn-g xs" onClick={() => handleView(salon._id)}>View</button>
                          <button className="btn btn-c xs" onClick={() => handleEditOpen(salon._id)}>Edit</button>
                          <button className="btn btn-d xs" onClick={() => setDeleteId(salon._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editSalon && (
        <div className="modal-overlay" onClick={() => setEditSalon(null)} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "90%" }}>
            <div className="chdr">
              <h3>Edit Salon</h3>
              <span className="sub">Update salon details</span>
            </div>
            <form onSubmit={handleEditSubmit} className="fc">
              <div className="fg">
                <label>Salon Name</label>
                <input type="text" name="name" className="pf-inp" value={editForm.name || ""} onChange={handleEditChange} required />
              </div>
              <div className="fg">
                <label>Owner Name</label>
                <input type="text" name="ownerName" className="pf-inp" value={editForm.ownerName || ""} onChange={handleEditChange} />
              </div>
              <div className="fg">
                <label>Email</label>
                <input type="email" name="email" className="pf-inp" value={editForm.email || ""} onChange={handleEditChange} />
              </div>
              <div className="fg">
                <label>Phone</label>
                <input type="text" name="phone" className="pf-inp" value={editForm.phone || ""} onChange={handleEditChange} />
              </div>
              <div className="fg">
                <label>Address</label>
                <input type="text" name="location" className="pf-inp" value={editForm.location || ""} onChange={handleEditChange} />
              </div>
              <div className="mact" style={{ marginTop: "10px" }}>
                <button type="button" className="btn btn-g" onClick={() => setEditSalon(null)} disabled={editLoading}>Cancel</button>
                <button type="submit" className="btn btn-p" disabled={editLoading}>{editLoading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", width: "90%", textAlign: "center" }}>
            <div className="chdr">
              <h3>Delete Salon?</h3>
            </div>
            <p style={{ padding: "20px" }}>Are you sure you want to delete this salon? This action cannot be undone.</p>
            <div className="mact" style={{ justifyContent: "center" }}>
              <button className="btn btn-g" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</button>
              <button className="btn btn-d" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Salons;
