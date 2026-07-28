import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { getSalon, updateSalon } from "../../services/salonService";
import Card from "../../components/ui/Card";

const SalonProfile = () => {
  const { user } = useAuth();
  const { salonId } = useParams();
  const [salon, setSalon] = useState(null);
  const [vision, setVision] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  const canEditVision = ["super-admin", "manager"].includes(user?.role);

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await getSalon(salonId);
        setSalon(res.data);
        setVision(res.data.about || "");
      } catch (error) {
        console.error("Failed to load salon details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (salonId) {
      fetchSalon();
    }
  }, [salonId]);

  const managerName = salon?.managerName || "Manager details unavailable";
  const managerEmail = salon?.managerEmail || "Not available";
  const managerPhone = salon?.managerPhone || "Not available";
  const salonAddress = salon?.location || "Address unavailable";

  const handleSaveVision = async () => {
    if (!canEditVision) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await updateSalon(salonId, { about: vision });
      setSalon(res.data);
      setMessage("Vision updated successfully.");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update salon vision:", error);
      setMessage(error.response?.data?.message || "Unable to save vision.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <Card glass accent padding="p-6" className="overflow-hidden">
        <Card.Header className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Card.Title className="text-3xl md:text-4xl">Salon Details</Card.Title>
          </div>
        </Card.Header>

        {loading ? (
          <div className="text-sm text-muted-2">Loading salon details...</div>
        ) : (
          <div className="grid-cols-1 gap-6 text-sm text-muted-2 sm:grid">
            <div className="space-y-4 bg-surface-3 rounded-3xl border border-border p-5">
              <h2 className="text-base font-bold uppercase tracking-[0.24em] text-accent">Manager Contact</h2>
              <div className="space-y-4">
                <div>
                  <span className="block text-xs uppercase tracking-[0.2em] text-muted-2 mb-1">Manager Name</span>
                  <p className="text-white">{managerName}</p>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.2em] text-muted-2 mb-1">Email</span>
                  <p className="text-white">{managerEmail}</p>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.2em] text-muted-2 mb-1">Phone</span>
                  <p className="text-white">{managerPhone}</p>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.2em] text-muted-2 mb-1">Address</span>
                  <p className="text-white">{salonAddress}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card glass className="p-6">
        <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Card.Title className="text-3xl">Vision</Card.Title>
          </div>
          {canEditVision && !loading && (
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10"
            >
              {isEditing ? "Cancel" : "Edit Vision"}
            </button>
          )}
        </Card.Header>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={6}
              className="w-full bg-surface-3 border border-border rounded-3xl p-4 text-sm text-white outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20"
              placeholder="Enter salon vision statement"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveVision}
                disabled={saving}
                className="rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-primary disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Vision"}
              </button>
              {message && <span className="text-sm text-muted-2">{message}</span>}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface-3 p-5 text-sm text-muted-2">
            {loading
              ? "Loading vision..."
              : salon?.about || "No vision statement is available for this salon yet."}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SalonProfile;
