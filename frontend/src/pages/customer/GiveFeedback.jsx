import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getAppointment } from "../../services/appointmentService";
import { submitFeedback } from "../../services/feedbackService";

export default function GiveFeedback() {
  const { appointmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(location.state?.appointment || null);
  const [loading, setLoading] = useState(!location.state?.appointment);
  const [serviceRating, setServiceRating] = useState(5);
  const [staffRating, setStaffRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (appointment) return;
    if (!appointmentId) return;

    setLoading(true);
    getAppointment(appointmentId)
      .then((res) => setAppointment(res.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load appointment details."))
      .finally(() => setLoading(false));
  }, [appointment, appointmentId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!appointment) return;

    setSaving(true);
    setError("");

    try {
      await submitFeedback({
        appointment_id: appointment._id,
        serviceRating,
        staffRating,
        comment
      });
      navigate("/my-appointments", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center max-w-lg w-full">
          <p className="text-white font-bold">Appointment details not available.</p>
          <button
            onClick={() => navigate("/my-appointments")}
            className="mt-4 px-4 py-2 bg-accent text-primary text-xs font-extrabold rounded-lg hover:bg-accent-hover"
          >
            Back to My Appointments
          </button>
        </div>
      </div>
    );
  }

  if (appointment.feedback_submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center max-w-lg w-full">
          <p className="text-white font-bold">Feedback already submitted for this appointment.</p>
          <button
            onClick={() => navigate("/my-appointments")}
            className="mt-4 px-4 py-2 bg-accent text-primary text-xs font-extrabold rounded-lg hover:bg-accent-hover"
          >
            Back to My Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Give Feedback</h1>
        <p className="text-muted-2 text-sm mt-2">Help the salon improve by rating your completed appointment.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl p-6 mb-6">
        <div className="mb-4">
          <p className="text-muted-2 text-xs uppercase tracking-[0.18em] mb-2">Appointment</p>
          <p className="text-white font-bold text-lg">{appointment.salon_id?.name}</p>
          <p className="text-muted-2 text-sm mt-1">{appointment.appointment_date} · {appointment.start_time} - {appointment.end_time}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-surface-2 rounded-2xl p-4">
            <p className="text-muted-2 text-xs uppercase tracking-[0.18em] mb-2">Service</p>
            <p className="text-white font-bold">{appointment.service_id?.service_name}</p>
          </div>
          <div className="bg-surface-2 rounded-2xl p-4">
            <p className="text-muted-2 text-xs uppercase tracking-[0.18em] mb-2">Staff</p>
            <p className="text-white font-bold">{appointment.staff_id?.full_name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-3xl p-6 space-y-6">
        <div>
          <label className="text-sm font-bold text-white">Service Rating</label>
          <select
            value={serviceRating}
            onChange={(e) => setServiceRating(Number(e.target.value))}
            className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-white"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value} Star{value > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-white">Staff Rating</label>
          <select
            value={staffRating}
            onChange={(e) => setStaffRating(Number(e.target.value))}
            className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-white"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value} Star{value > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-white">Comments</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            placeholder="Tell us about your experience..."
            className="mt-2 w-full rounded-3xl border border-border bg-surface-2 px-4 py-3 text-white placeholder:text-muted-2"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/my-appointments")}
            className="px-5 py-3 rounded-2xl border border-border text-sm font-bold text-muted-2 hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-3 rounded-2xl bg-accent text-primary text-sm font-black hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  );
}
