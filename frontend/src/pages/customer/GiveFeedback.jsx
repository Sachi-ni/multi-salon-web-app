import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getAppointment } from "../../services/appointmentService";
import { submitFeedback } from "../../services/feedbackService";
import { Star, ArrowLeft, MapPin, Scissors, User, Calendar, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomerDashboardBackground from "../../components/ui/CustomerDashboardBackground";

/* ─── Interactive Star Rating ─── */
function StarRating({ value, onChange, label, icon: Icon }) {
  const [hovered, setHovered] = useState(0);

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[#d4af37]" />
        <span className="text-sm font-bold text-white uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hovered || value);
          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-1 focus:outline-none"
            >
              <Star
                className={`w-9 h-9 transition-all duration-200 ${
                  isActive
                    ? "text-[#d4af37] fill-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                    : "text-white/15 hover:text-white/30"
                }`}
              />
            </motion.button>
          );
        })}
        <AnimatePresence mode="wait">
          <motion.span
            key={hovered || value}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            className={`ml-3 text-sm font-semibold ${
              (hovered || value) >= 4 ? "text-[#d4af37]" : (hovered || value) >= 3 ? "text-white/70" : "text-white/40"
            }`}
          >
            {labels[hovered || value]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

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
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (appointment) return;
    if (!appointmentId) return;

    setLoading(true);
    getAppointment(appointmentId)
      .then((res) => setAppointment(res.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load appointment details."))
      .finally(() => setLoading(false));
  }, [appointment, appointmentId]);

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

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
      setSubmitted(true);
      setTimeout(() => navigate("/customer/dashboard", { replace: true }), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-2 text-sm font-medium">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-3xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-2" />
          </div>
          <p className="text-white font-bold text-lg">Appointment not found</p>
          <p className="text-muted-2 text-sm mt-2 mb-6">We couldn't find the appointment details.</p>
          <button
            onClick={() => navigate("/customer/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#aa8123] text-primary text-sm font-bold rounded-xl hover:scale-[1.02] transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (appointment.feedback_submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-3xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-white font-bold text-lg">Feedback Already Submitted</p>
          <p className="text-muted-2 text-sm mt-2 mb-6">You've already shared your feedback for this appointment.</p>
          <button
            onClick={() => navigate("/customer/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#aa8123] text-primary text-sm font-bold rounded-xl hover:scale-[1.02] transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ─── Success State ─── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4 relative overflow-hidden">
        <CustomerDashboardBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 text-center max-w-md w-full relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 flex items-center justify-center border border-[#d4af37]/30"
          >
            <CheckCircle2 className="w-10 h-10 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
          </motion.div>
          <h2 className="text-2xl font-display font-black text-white mb-2">Thank You!</h2>
          <p className="text-muted-2 text-sm">Your feedback helps us improve our services. Redirecting you back...</p>
          <div className="mt-6 w-full h-1 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#aa8123] rounded-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pt-28 pb-20 relative overflow-hidden">
      <CustomerDashboardBackground />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/customer/dashboard")}
          className="flex items-center gap-2 text-muted-2 hover:text-white text-sm font-medium mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight mb-2">
            Share Your Experience
          </h1>
          <p className="text-muted-2 text-base font-medium">
            Your feedback helps our salon team improve and serve you better.
          </p>
        </motion.div>

        {/* Appointment Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-surface to-surface-2/80 border border-white/10 rounded-3xl p-6 md:p-8 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
        >
          <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {appointment.salon_id?.name || "Salon"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-muted-2 text-xs uppercase tracking-widest mb-2">
                <Scissors className="w-3.5 h-3.5 text-[#d4af37]" />
                Service
              </div>
              <p className="text-white font-bold text-lg">{appointment.service_id?.service_name}</p>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-muted-2 text-xs uppercase tracking-widest mb-2">
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                Staff
              </div>
              <p className="text-white font-bold text-lg">{appointment.staff_id?.full_name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl text-sm border border-white/5">
              <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-white/80 font-medium">
                {new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl text-sm border border-white/5">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-white/80 font-medium">
                {formatTime(appointment.start_time)} — {formatTime(appointment.end_time)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Feedback Form */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-surface to-surface-2/60 border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] space-y-8"
        >
          {/* Ratings Section */}
          <div className="space-y-8">
            <StarRating
              value={serviceRating}
              onChange={setServiceRating}
              label="Service Rating"
              icon={Scissors}
            />

            <div className="border-t border-white/5" />

            <StarRating
              value={staffRating}
              onChange={setStaffRating}
              label="Staff Rating"
              icon={User}
            />
          </div>

          <div className="border-t border-white/5" />

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-[#d4af37]" />
              <label className="text-sm font-bold text-white uppercase tracking-wider">Your Comments</label>
              <span className="text-muted-2 text-xs ml-auto">{comment.length}/500</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              rows={5}
              placeholder="Tell us what you loved, or how we can improve..."
              className="w-full rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm px-5 py-4 text-white placeholder:text-muted-2 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm leading-relaxed resize-none"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-danger text-sm font-medium bg-danger/10 border border-danger/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate("/customer/dashboard")}
              className="px-6 py-3 rounded-xl border border-white/10 text-sm font-semibold text-muted-2 hover:bg-white/5 hover:text-white transition-all text-center"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8123] text-primary text-sm font-black hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-yellow-300/30"
            >
              <Send className="w-4 h-4" />
              {saving ? "Submitting..." : "Submit Feedback"}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
