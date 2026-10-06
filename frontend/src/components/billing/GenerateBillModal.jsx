import React, { useState, useMemo } from "react";
import {
  Receipt,
  CreditCard,
  Banknote,
  Globe,
  Building,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Percent
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { createBill } from "../../services/billingService";

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "online", label: "Online Payment", icon: Globe },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building },
];

const GenerateBillModal = ({ isOpen, onClose, appointment, onBillGenerated }) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Resolve service items from appointment
  const items = useMemo(() => {
    if (!appointment) return [];
    if (appointment.appointment_services && appointment.appointment_services.length > 0) {
      return appointment.appointment_services.map((as) => ({
        service_name: as.service_id?.service_name || "Salon Service",
        price: as.sub_price || as.service_id?.base_price || 0,
        duration: as.service_id?.duration || 0,
        staff_name: as.staff_id?.full_name || appointment.staff_id?.full_name || "",
      }));
    }
    if (appointment.service_ids && appointment.service_ids.length > 0) {
      return appointment.service_ids.map((s) => ({
        service_name: s.service_name || "Salon Service",
        price: s.base_price || 0,
        duration: s.duration || 0,
        staff_name: appointment.staff_id?.full_name || "",
      }));
    }
    if (appointment.service_id) {
      return [
        {
          service_name: appointment.service_id.service_name || "Salon Service",
          price: appointment.service_id.base_price || 0,
          duration: appointment.service_id.duration || 0,
          staff_name: appointment.staff_id?.full_name || "",
        },
      ];
    }
    return [
      {
        service_name: "Completed Salon Service",
        price: appointment.total_price || 0,
        duration: appointment.duration || 60,
        staff_name: appointment.staff_id?.full_name || "",
      },
    ];
  }, [appointment]);

  const subtotal = useMemo(() => {
    const itemsTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    return itemsTotal > 0 ? itemsTotal : (appointment?.total_price || 0);
  }, [items, appointment]);

  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxAmount = Math.max(0, Number(tax) || 0);
  const totalAmount = Math.max(0, Math.round(subtotal - discountAmount + taxAmount));

  if (!appointment) return null;

  const customerName = appointment.customer_id?.name || appointment.guest_name || "Guest Customer";
  const customerPhone = appointment.customer_id?.phone || appointment.guest_phone || "Not provided";
  const customerEmail = appointment.customer_id?.email || "Not provided";
  const salonName = appointment.salon_id?.name || "Salon Branch";
  const refCode = `#APT-${appointment._id.slice(-6).toUpperCase()}`;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        appointment_id: appointment._id,
        payment_method: paymentMethod,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total_amount: totalAmount,
        notes: notes.trim(),
        bill_date: new Date().toISOString(),
      };

      const res = await createBill(payload);
      const generatedBill = res.data?.bill || res.data;

      if (onBillGenerated) {
        onBillGenerated(generatedBill);
      }
      onClose();
    } catch (err) {
      console.error("Bill creation failed:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to generate bill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Customer Bill"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & Appointment Info Card */}
        <div className="bg-surface-2/70 border border-border/80 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-sm">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="text-2xs font-extrabold text-amber-400 uppercase tracking-wider">{refCode}</span>
                <h4 className="text-sm font-bold text-white leading-none">{customerName}</h4>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xs text-muted-2 block">Salon Branch</span>
              <span className="text-xs font-semibold text-neutral-200">{salonName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-2xs text-neutral-300">
            <div>
              <span className="text-muted-2 block">Phone</span>
              <span className="font-semibold text-white">{customerPhone}</span>
            </div>
            <div>
              <span className="text-muted-2 block">Email</span>
              <span className="font-semibold text-white truncate block">{customerEmail}</span>
            </div>
            <div>
              <span className="text-muted-2 block">Appointment Date</span>
              <span className="font-semibold text-white">{appointment.appointment_date} ({appointment.start_time})</span>
            </div>
          </div>
        </div>

        {/* Itemized Services Table */}
        <div>
          <label className="text-xs font-bold text-neutral-300 mb-2 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            Service Items
          </label>
          <div className="border border-border rounded-xl overflow-hidden bg-surface-2/40">
            <table className="w-full text-xs">
              <thead className="bg-surface-2/80 text-muted-2 border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 text-left font-bold">Service & Stylist</th>
                  <th className="py-2.5 px-3 text-center font-bold">Duration</th>
                  <th className="py-2.5 px-3 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-white">{item.service_name}</p>
                      {item.staff_name && (
                        <p className="text-2xs text-muted-2">Stylist: {item.staff_name}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-2">
                      {item.duration ? `${item.duration} min` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      LKR {Number(item.price || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="text-xs font-bold text-neutral-300 mb-2 block">Payment Method</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    isSelected
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 shadow-sm shadow-amber-400/10"
                      : "bg-surface-2/50 border-border text-neutral-400 hover:text-white hover:border-neutral-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-2xs font-bold">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Adjustments: Discount & Tax */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              Discount (LKR)
            </label>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-sky-400" />
              Tax / Service Charge (LKR)
            </label>
            <input
              type="number"
              min="0"
              value={tax}
              onChange={(e) => setTax(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-neutral-300 mb-1.5 block">Invoice Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Paid in full at front desk. Thank you!"
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Calculation Breakdown & Total Banner */}
        <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-2">
            <span>Subtotal:</span>
            <span className="font-semibold text-white">LKR {subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400">
              <span>Discount Applied:</span>
              <span>- LKR {discountAmount.toLocaleString()}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-xs text-sky-400">
              <span>Tax / Charges:</span>
              <span>+ LKR {taxAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-border/80 pt-2 flex justify-between items-center">
            <span className="text-sm font-extrabold text-white">Total Amount Due:</span>
            <span className="text-xl font-black text-amber-400">
              LKR {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <Modal.Actions>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Bill...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Issue Bill
              </>
            )}
          </Button>
        </Modal.Actions>
      </form>
    </Modal>
  );
};

export default GenerateBillModal;
