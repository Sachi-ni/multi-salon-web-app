import { useRef, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { createStaffUnavailability } from "../../services/staffService";

export default function StaffUnavailableModal({ staff, onClose, onSuccess }) {
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await createStaffUnavailability({
        staff_id: staff._id,
        start_date_time: startDateTime,
        end_date_time: endDateTime,
        reason,
      });
      onSuccess?.(response.data);
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark staff unavailable.");
    } finally {
      requestInFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(staff)} onClose={onClose} title={`Mark ${staff.full_name || staff.name} Unavailable`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-danger">{error}</p>}
        <label className="block text-xs text-muted-2 font-semibold">Starts
          <input required type="datetime-local" value={startDateTime} onChange={(event) => setStartDateTime(event.target.value)} className="mt-1 w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white" />
        </label>
        <label className="block text-xs text-muted-2 font-semibold">Ends
          <input required type="datetime-local" value={endDateTime} onChange={(event) => setEndDateTime(event.target.value)} className="mt-1 w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white" />
        </label>
        <label className="block text-xs text-muted-2 font-semibold">Reason
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white">
            <option value="">Select a reason</option>
            <option value="Sick">Sick</option>
            <option value="Emergency">Emergency</option>
            <option value="Accident">Accident</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <Modal.Actions>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>Mark Unavailable</Button>
        </Modal.Actions>
      </form>
    </Modal>
  );
}
