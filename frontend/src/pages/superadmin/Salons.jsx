import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSalons, getSalon, updateSalon, deleteSalon } from "../../services/salonService";
import { Plus, ArrowUpDown, Store } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { MoreVertical, MapPin, User, DollarSign, Pencil, Trash2, Eye } from "lucide-react";

const SalonCard = ({ salon, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="group relative bg-surface border border-border rounded-xl p-5 hover:shadow-lg transition-all">
      {/* Salon Name */}
      <h3 className="text-lg font-bold text-white mb-1">{salon.name}</h3>
    
      <p className="text-sm text-muted-2 mb-3">{salon.location || "No address"}</p>

      {/* Manager + Revenue */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-2">
          <User className="w-4 h-4" />
          {salon.managerName || "Unknown Manager"}
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-accent">
          <DollarSign className="w-4 h-4" />
          Rs. {salon.revenue ? salon.revenue.toLocaleString() : "0"}
        </div>
      </div>

      {/* Staff Count + Created Date */}
      <div className="flex items-center justify-between text-xs text-muted-2 mb-4">
        <span>Staff: {salon.staffCount || 0}</span>
        <span>Created: {new Date(salon.createdAt).toLocaleDateString()}</span>
      </div>



      {/* Actions */}
      <div className="flex gap-5">
        <Button variant="primary" size="sm" onClick={() => navigate(`/AddStaff/${salon._id}`)}>
          Add Staff
        </Button>
        <Button variant="primary" size="sm" onClick={() => navigate(`/AddService/${salon._id}`)}>
          Add Service
        </Button>
      </div>
      
      {/* View Button */}
      <div className="absolute bottom-6 right-6">
        <div onClick={() => onView(salon._id)} title="View">
          <Eye className="w-4 h-4 text-blue-500" />
        </div>
      </div>
      


      {/* Three-dot menu trigger */}
      <div className="absolute top-4 right-4" ref={menuRef}>
        <button onClick={() => setOpenMenu(!openMenu)}>
          <MoreVertical className="w-5 h-5 text-muted-2 hover:text-white" />
        </button>

        {/* Dropdown menu */}
        {openMenu && (
          <div className="absolute right-0 mt-2 w-32 bg-surface-2 border border-border rounded-md shadow-lg">
            <button
              onClick={() => onEdit(salon._id)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface"
            >
              <Pencil className="w-4 h-4 text-yellow-500" /> Edit
            </button>
            <button
              onClick={() => onDelete(salon._id)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface"
            >
              <Trash2 className="w-4 h-4 text-red-500" /> Delete
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

const Salons = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salonList, setSalonList] = useState([]);
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

  useEffect(() => { fetchSalons(); }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleView = (id) => navigate(`/admin/dashboard/${id}`);

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
      return sortAsc ? (nameA > nameB ? 1 : -1) : (nameA < nameB ? 1 : -1);
    });
    setSalonList(sorted);
    setSortAsc(!sortAsc);
  };

  return (
    <div>
      <PageHeader title="Salons" subtitle="All registered salon locations" backTo="/superAdminDashboard">
        <Button variant="primary" icon={Plus} onClick={() => navigate("/AddSalon")}>
          Add Salon
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-muted-2 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton.Card key={i} />)}
        </div>
      ) : (
        <>
          {/* Sort Header */}
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-white">Salon Directory</h3>
            <Button variant="primary" size="sm" icon={ArrowUpDown} onClick={handleSortByName}>
              Sort by name {sortAsc ? "▲" : "▼"}
            </Button>
          </div>

          {salonList.length === 0 ? (
            <EmptyState
              title="No salons found"
              description="Add your first salon to get started."
              actionLabel="Add Salon"
              onAction={() => navigate("/AddSalon")}
              icon={Store}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salonList.map((salon) => (
                <SalonCard
                  key={salon._id}
                  salon={salon}
                  onView={handleView}
                  onEdit={handleEditOpen}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          )}

        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editSalon} onClose={() => setEditSalon(null)} title="Edit Salon">
        <form onSubmit={handleEditSubmit}>
          <Input label="Salon Name" name="name" value={editForm.name || ""} onChange={handleEditChange} required />
          <Input label="Email" name="email" type="email" value={editForm.email || ""} onChange={handleEditChange} />
          <Input label="Phone" name="phone" value={editForm.phone || ""} onChange={handleEditChange} />
          <Input label="Address" name="location" value={editForm.location || ""} onChange={handleEditChange} />
          <Modal.Actions>
            <Button variant="ghost" type="button" onClick={() => setEditSalon(null)} disabled={editLoading}>Cancel</Button>
            <Button variant="primary" type="submit" loading={editLoading}>Save</Button>
          </Modal.Actions>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Salon?" maxWidth="max-w-sm">
        <p className="text-sm text-muted-2 py-4 text-center">
          Are you sure you want to delete this salon? This action cannot be undone.
        </p>
        <Modal.Actions className="justify-center">
          <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>Delete</Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export default Salons;
