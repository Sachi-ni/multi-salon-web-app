import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import { getSalonFeedback } from "../../services/feedbackService";

export default function AdminReviews() {
  const { salonId } = useParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getSalonFeedback(salonId)
      .then(res => setFeedbacks(res.data))
      .catch(err => setError(err.response?.data?.message || "Failed to load feedbacks."))
      .finally(() => setLoading(false));
  }, [salonId]);

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Customer feedback for your salon" backTo={`/salon-admin/${salonId}/adminDashboard`} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-3 bg-danger-dim border border-danger-border rounded-lg mb-4">
          <p className="text-danger text-xs font-bold">{error}</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="text-muted-2 text-sm">No feedback available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(f => (
            <div key={f._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-extrabold">{f.customer_id?.name || 'Guest'}</p>
                  <p className="text-muted-2 text-xs mt-1">{f.appointment_id?.appointment_date} · {f.appointment_id?.start_time}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-2 text-xs">Service</p>
                  <p className="text-white font-bold">{f.service_id?.service_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-muted-2 text-xs">Staff</p>
                  <p className="text-white font-bold">{f.staff_id?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-2 text-xs">Service Rating</p>
                  <p className="text-white font-bold">{f.serviceRating} / 5</p>
                </div>
                <div>
                  <p className="text-muted-2 text-xs">Staff Rating</p>
                  <p className="text-white font-bold">{f.staffRating} / 5</p>
                </div>
              </div>

              {f.comment && (
                <div className="text-muted-2 text-sm">"{f.comment}"</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
