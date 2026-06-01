import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSalons, getSalon, updateSalon, deleteSalon } from "../../services/salonService";
import { Plus, ArrowUpDown, Store } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";

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
            <Table>
              <Table.Head>
                <Table.Th>Salon</Table.Th>
                <Table.Th>Owner</Table.Th>
                <Table.Th>Revenue</Table.Th>
                <Table.Th>Staff</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Address</Table.Th>
                <Table.Th align="right">Actions</Table.Th>
              </Table.Head>
              <Table.Body>
                {salonList.map((salon) => (
                  <tr key={salon._id}>
                    <Table.Td bold>{salon.name}</Table.Td>
                    <Table.Td>{salon.ownerName || "-"}</Table.Td>
                    <Table.Td className="text-accent font-semibold">
                      Rs. {salon.revenue ? salon.revenue.toLocaleString() : "0"}
                    </Table.Td>
                    <Table.Td>{salon.staffCount || 0}</Table.Td>
                    <Table.Td>{formatDate(salon.createdAt)}</Table.Td>
                    <Table.Td className="text-muted-2">{salon.location || "-"}</Table.Td>
                    <Table.Td align="right">
                      <div className="flex gap-1.5 justify-end">
                        <Button variant="ghost" size="xs" onClick={() => handleView(salon._id)}>View</Button>
                        <Button variant="info" size="xs" onClick={() => handleEditOpen(salon._id)}>Edit</Button>
                        <Button variant="danger" size="xs" onClick={() => setDeleteId(salon._id)}>Delete</Button>
                      </div>
                    </Table.Td>
                  </tr>
                ))}
              </Table.Body>
            </Table>
          )}
        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editSalon} onClose={() => setEditSalon(null)} title="Edit Salon">
        <form onSubmit={handleEditSubmit}>
          <Input label="Salon Name" name="name" value={editForm.name || ""} onChange={handleEditChange} required />
          <Input label="Owner Name" name="ownerName" value={editForm.ownerName || ""} onChange={handleEditChange} />
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
