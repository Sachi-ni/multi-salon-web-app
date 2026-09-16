import React from "react";
import Modal from "../ui/Modal";

const money = (value) => `LKR ${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const hour = date.getHours();
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${suffix}`;
};

const CompletedAppointmentBill = ({ appointment, onClose }) => {
  if (!appointment) return null;

  const services = Array.isArray(appointment.appointment_services) && appointment.appointment_services.length > 0
    ? appointment.appointment_services
    : (appointment.service_ids || []).map((service) => ({
        service_id: service,
        staff_id: appointment.staff_id,
        sub_price: service.base_price,
      }));
  const rows = services.length > 0 ? services : [{
    service_id: appointment.service_id,
    staff_id: appointment.staff_id,
    sub_price: appointment.total_price,
  }];
  const total = Number(appointment.total_price || rows.reduce((sum, row) => sum + Number(row.sub_price || row.service_id?.base_price || 0), 0));
  const invoiceNumber = appointment.invoice_number || `INV-${String(appointment._id || "").slice(-8).toUpperCase()}`;
  const appointmentNumber = `#APT-${String(appointment._id || "").slice(-6).toUpperCase()}`;
  const salonName = appointment.salon_id?.name || "Salon";
  const salonLocation = appointment.salon_id?.location || "";
  const staffName = appointment.staff_id?.full_name || "-";

  return (
    <Modal isOpen={Boolean(appointment)} onClose={onClose} title="Payment Receipt" maxWidth="max-w-2xl">
      <div className="overflow-hidden rounded-xl border border-border bg-[#111111] font-mono text-[11px] leading-5 text-neutral-300 shadow-card sm:text-xs">
        <div className="bg-gradient-to-r from-amber-400/15 via-amber-300/5 to-transparent px-5 py-4 text-center sm:px-7">
          <p className="text-lg font-black tracking-[0.18em] text-amber-300">{salonName.toUpperCase()}</p>
          <p className="text-neutral-400">{salonLocation || "Salon Branch"}</p>
          {appointment.salon_id?.phone && <p className="text-neutral-500">Tel: {appointment.salon_id.phone}</p>}
        </div>

        <div className="mx-5 border-t border-dashed border-border sm:mx-7" />
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 px-5 py-3 text-neutral-300 sm:px-7">
          <span className="text-neutral-500">Invoice No</span><span className="font-bold text-white">{invoiceNumber}</span>
          <span className="text-neutral-500">Appointment No</span><span className="font-bold text-amber-300">{appointmentNumber}</span>
          <span className="text-neutral-500">Date</span><span className="font-bold text-white">{formatDate(appointment.completed_at || appointment.updatedAt)}</span>
          <span className="text-neutral-500">Time</span><span className="font-bold text-white">{formatTime(appointment.completed_at || appointment.updatedAt)}</span>
          <span className="text-neutral-500">Served By</span><span className="font-bold text-white">{salonName}</span>
        </div>

        <div className="mx-5 border-t border-dashed border-border sm:mx-7" />
        <div className="px-5 py-3 sm:px-7">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 pb-1.5 font-black uppercase tracking-wider text-amber-300">
            <span>Service</span><span>Staff</span><span className="text-right">Amount</span>
          </div>
          {rows.map((row, index) => {
            const service = row.service_id || {};
            const staff = row.staff_id || {};
            return (
              <div key={row._id || index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-t border-border/60 py-1.5">
                <span className="text-white">{service.service_name || "Service"}</span>
                <span>{staff.full_name || staffName}</span>
                <span className="text-right text-amber-400">{money(row.sub_price ?? service.base_price).replace("LKR ", "")}</span>
              </div>
            );
          })}
        </div>

        <div className="mx-5 border-t border-dashed border-border sm:mx-7" />
        <div className="flex items-center justify-between px-5 py-3 text-sm font-black sm:px-7">
          <span className="text-neutral-400">TOTAL</span>
          <span className="text-amber-300">{money(total)}</span>
        </div>

        <div className="border-t border-border bg-black/20 px-5 py-3 text-center font-bold sm:px-7">
          <p className="text-amber-300">Thank you for visiting us!</p>
          <p className="text-neutral-500">Please come again</p>
        </div>
      </div>
    </Modal>
  );
};

export default CompletedAppointmentBill;
