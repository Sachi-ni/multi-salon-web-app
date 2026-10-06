import React from "react";
import {
  Receipt,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  CreditCard
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const InvoiceModal = ({ isOpen, onClose, bill, appointment }) => {
  if (!bill && !appointment) return null;

  // Resolve bill data
  const billData = bill || appointment?.bill;
  const apptData = appointment || billData?.appointment_id;

  const invoiceNumber = billData?.bill_number || `INV-${(billData?._id || apptData?._id || "000000").slice(-6).toUpperCase()}`;
  const billDate = billData?.bill_date ? new Date(billData.bill_date).toLocaleDateString() : new Date().toLocaleDateString();
  const salonName = billData?.salon_id?.name || apptData?.salon_id?.name || "SalonHub";
  const salonLocation = billData?.salon_id?.location || apptData?.salon_id?.location || "";
  const salonPhone = billData?.salon_id?.phone || apptData?.salon_id?.phone || "";
  const salonEmail = billData?.salon_id?.email || apptData?.salon_id?.email || "";

  const customerName = billData?.customer_name || apptData?.customer_id?.name || apptData?.guest_name || "Valued Customer";
  const customerPhone = billData?.customer_phone || apptData?.customer_id?.phone || apptData?.guest_phone || "";
  const customerEmail = billData?.customer_email || apptData?.customer_id?.email || "";

  const appointmentDate = apptData?.appointment_date || "—";
  const appointmentTime = apptData?.start_time || "—";

  // Items
  const items = (billData?.items && billData.items.length > 0)
    ? billData.items
    : (apptData?.service_ids && apptData.service_ids.length > 0)
      ? apptData.service_ids.map(s => ({
          service_name: s.service_name,
          price: s.base_price,
          duration: s.duration,
          staff_name: apptData?.staff_id?.full_name || ""
        }))
      : [
          {
            service_name: apptData?.service_id?.service_name || "Salon Service",
            price: billData?.subtotal || billData?.total_amount || apptData?.total_price || 0,
            duration: apptData?.duration || 60,
            staff_name: apptData?.staff_id?.full_name || ""
          }
        ];

  const subtotal = billData?.subtotal || items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const discount = billData?.discount || 0;
  const tax = billData?.tax || 0;
  const totalAmount = billData?.total_amount || (subtotal - discount + tax);
  const paymentMethod = (billData?.payment_method || "cash").toUpperCase();
  const issuedBy = billData?.issued_by || "Salon Administration";
  const notes = billData?.notes || "";

  // ── Print Functionality ───────────────────────────────────────────────────
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #111827;
              background: #ffffff;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 32px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #f3f4f6;
              padding-bottom: 24px;
              margin-bottom: 24px;
            }
            .brand h1 {
              margin: 0;
              font-size: 26px;
              color: #d97706;
            }
            .brand p {
              margin: 4px 0 0;
              font-size: 13px;
              color: #6b7280;
            }
            .inv-meta {
              text-align: right;
            }
            .inv-badge {
              display: inline-block;
              background: #dcfce7;
              color: #15803d;
              font-weight: bold;
              font-size: 12px;
              padding: 4px 12px;
              border-radius: 9999px;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 24px;
              font-size: 13px;
            }
            .card {
              background: #f9fafb;
              border-radius: 8px;
              padding: 16px;
            }
            .card h4 {
              margin: 0 0 8px 0;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              font-size: 13px;
            }
            th {
              background: #f9fafb;
              text-align: left;
              padding: 10px 12px;
              border-bottom: 2px solid #e5e7eb;
              color: #4b5563;
              font-size: 11px;
              text-transform: uppercase;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            .totals {
              margin-left: auto;
              width: 280px;
              font-size: 13px;
            }
            .totals div {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .totals .grand-total {
              border-top: 2px solid #e5e7eb;
              margin-top: 8px;
              padding-top: 8px;
              font-size: 16px;
              font-weight: bold;
              color: #b45309;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
              margin-top: 40px;
              border-top: 1px solid #f3f4f6;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="brand">
                <h1>${salonName}</h1>
                ${salonLocation ? `<p>${salonLocation}</p>` : ""}
                ${salonPhone ? `<p>Tel: ${salonPhone}</p>` : ""}
                ${salonEmail ? `<p>Email: ${salonEmail}</p>` : ""}
              </div>
              <div class="inv-meta">
                <div class="inv-badge">PAID</div>
                <h3 style="margin: 0; font-size: 18px;">${invoiceNumber}</h3>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Date: ${billDate}</p>
              </div>
            </div>

            <div class="details-grid">
              <div class="card">
                <h4>Billed To (Customer)</h4>
                <p style="margin: 0; font-weight: bold; font-size: 14px;">${customerName}</p>
                ${customerPhone ? `<p style="margin: 2px 0 0; color: #4b5563;">Phone: ${customerPhone}</p>` : ""}
                ${customerEmail ? `<p style="margin: 2px 0 0; color: #4b5563;">Email: ${customerEmail}</p>` : ""}
              </div>
              <div class="card">
                <h4>Appointment Details</h4>
                <p style="margin: 0; font-weight: bold;">Date: ${appointmentDate}</p>
                <p style="margin: 2px 0 0; color: #4b5563;">Time: ${appointmentTime}</p>
                <p style="margin: 2px 0 0; color: #4b5563;">Payment: ${paymentMethod}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Service Details</th>
                  <th>Staff / Stylist</th>
                  <th style="text-align: center;">Duration</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(it => `
                  <tr>
                    <td><strong>${it.service_name}</strong></td>
                    <td style="color: #4b5563;">${it.staff_name || "Assigned Stylist"}</td>
                    <td style="text-align: center; color: #6b7280;">${it.duration ? it.duration + " min" : "—"}</td>
                    <td style="text-align: right; font-weight: bold;">LKR ${Number(it.price || 0).toLocaleString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="totals">
              <div><span>Subtotal:</span><span>LKR ${subtotal.toLocaleString()}</span></div>
              ${discount > 0 ? `<div style="color: #16a34a;"><span>Discount:</span><span>- LKR ${discount.toLocaleString()}</span></div>` : ""}
              ${tax > 0 ? `<div><span>Tax:</span><span>+ LKR ${tax.toLocaleString()}</span></div>` : ""}
              <div class="grand-total"><span>Total Paid:</span><span>LKR ${totalAmount.toLocaleString()}</span></div>
            </div>

            ${notes ? `<p style="font-size: 12px; color: #6b7280; font-style: italic; margin-top: 20px;">Note: ${notes}</p>` : ""}

            <div class="footer">
              <p>Issued by ${issuedBy}</p>
              <p>Thank you for choosing ${salonName}. We look forward to seeing you again!</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ── Download PDF Functionality ────────────────────────────────────────────
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text(salonName, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // gray
      if (salonLocation) doc.text(salonLocation, 14, 26);
      if (salonPhone) doc.text(`Phone: ${salonPhone}`, 14, 31);

      // Invoice info (Right side)
      doc.setFontSize(16);
      doc.setTextColor(17, 24, 39);
      doc.text(invoiceNumber, 196, 20, { align: "right" });

      doc.setFontSize(10);
      doc.setTextColor(22, 163, 74); // green
      doc.text("PAID", 196, 26, { align: "right" });

      doc.setTextColor(107, 114, 128);
      doc.text(`Date: ${billDate}`, 196, 31, { align: "right" });
      doc.text(`Payment: ${paymentMethod}`, 196, 36, { align: "right" });

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.line(14, 42, 196, 42);

      // Customer section
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text("Billed To:", 14, 50);
      doc.setFontSize(10);
      doc.text(customerName, 14, 56);
      if (customerPhone) doc.text(`Phone: ${customerPhone}`, 14, 61);
      if (customerEmail) doc.text(`Email: ${customerEmail}`, 14, 66);

      doc.setFontSize(11);
      doc.text("Appointment:", 120, 50);
      doc.setFontSize(10);
      doc.text(`Date: ${appointmentDate}`, 120, 56);
      doc.text(`Time: ${appointmentTime}`, 120, 61);

      // Table
      const tableBody = items.map((it) => [
        it.service_name,
        it.staff_name || "Assigned Stylist",
        it.duration ? `${it.duration} min` : "—",
        `LKR ${Number(it.price || 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 74,
        head: [["Service", "Stylist", "Duration", "Amount"]],
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [245, 158, 11] }, // amber
        styles: { fontSize: 9 },
        columnStyles: {
          3: { halign: "right" },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // Summary Table
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`Subtotal:`, 140, finalY);
      doc.text(`LKR ${subtotal.toLocaleString()}`, 196, finalY, { align: "right" });

      let currentY = finalY;
      if (discount > 0) {
        currentY += 6;
        doc.setTextColor(22, 163, 74);
        doc.text(`Discount:`, 140, currentY);
        doc.text(`- LKR ${discount.toLocaleString()}`, 196, currentY, { align: "right" });
      }

      if (tax > 0) {
        currentY += 6;
        doc.setTextColor(75, 85, 99);
        doc.text(`Tax:`, 140, currentY);
        doc.text(`+ LKR ${tax.toLocaleString()}`, 196, currentY, { align: "right" });
      }

      currentY += 8;
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(180, 83, 9);
      doc.text(`Total Paid:`, 140, currentY);
      doc.text(`LKR ${totalAmount.toLocaleString()}`, 196, currentY, { align: "right" });

      // Footer
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(`Issued by ${issuedBy} • Thank you for choosing ${salonName}!`, 105, 280, { align: "center" });

      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to export PDF: " + err.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Invoice / Bill"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Invoice Container */}
        <div className="bg-surface-2/60 border border-border/80 rounded-2xl p-5 sm:p-7 space-y-6">
          {/* Top Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-black text-white">{salonName}</h3>
              </div>
              {salonLocation && (
                <p className="text-2xs text-muted-2 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {salonLocation}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xs font-extrabold uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Paid
              </span>
              <p className="text-sm font-black text-amber-400">{invoiceNumber}</p>
              <p className="text-2xs text-muted-2">Issued: {billDate}</p>
            </div>
          </div>

          {/* Customer & Appointment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-surface-2 border border-border/60 rounded-xl p-3.5 space-y-1">
              <span className="text-2xs font-extrabold text-muted-2 uppercase tracking-wider block mb-1">
                Customer Details
              </span>
              <p className="font-extrabold text-white text-sm">{customerName}</p>
              {customerPhone && (
                <p className="text-muted-2 text-2xs flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-neutral-400" /> {customerPhone}
                </p>
              )}
              {customerEmail && (
                <p className="text-muted-2 text-2xs flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-neutral-400" /> {customerEmail}
                </p>
              )}
            </div>

            <div className="bg-surface-2 border border-border/60 rounded-xl p-3.5 space-y-1">
              <span className="text-2xs font-extrabold text-muted-2 uppercase tracking-wider block mb-1">
                Appointment Summary
              </span>
              <p className="text-muted-2 text-2xs flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-amber-400" /> Date: <strong className="text-white">{appointmentDate}</strong>
              </p>
              <p className="text-muted-2 text-2xs flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" /> Time: <strong className="text-white">{appointmentTime}</strong>
              </p>
              <p className="text-muted-2 text-2xs flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-amber-400" /> Method: <strong className="text-white">{paymentMethod}</strong>
              </p>
            </div>
          </div>

          {/* Services Breakdown */}
          <div className="border border-border/80 rounded-xl overflow-hidden bg-surface-2/40">
            <table className="w-full text-xs">
              <thead className="bg-surface-2/90 text-muted-2 border-b border-border">
                <tr>
                  <th className="py-2.5 px-3.5 text-left font-bold">Service</th>
                  <th className="py-2.5 px-3.5 text-left font-bold">Stylist</th>
                  <th className="py-2.5 px-3.5 text-center font-bold">Duration</th>
                  <th className="py-2.5 px-3.5 text-right font-bold">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3.5 font-bold text-white">{it.service_name}</td>
                    <td className="py-2.5 px-3.5 text-muted-2">{it.staff_name || "—"}</td>
                    <td className="py-2.5 px-3.5 text-center text-muted-2">{it.duration ? `${it.duration}m` : "—"}</td>
                    <td className="py-2.5 px-3.5 text-right font-extrabold text-white">
                      LKR {Number(it.price || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-muted-2">
                <span>Subtotal:</span>
                <span className="font-semibold text-white">LKR {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>- LKR {discount.toLocaleString()}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-sky-400">
                  <span>Tax:</span>
                  <span>+ LKR {tax.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border/80 pt-2 flex justify-between items-center text-sm font-black">
                <span className="text-white">Total Paid:</span>
                <span className="text-amber-400 text-base">
                  LKR {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {notes && (
            <p className="text-2xs text-muted-2 italic bg-surface-2 p-3 rounded-lg border border-border">
              Note: {notes}
            </p>
          )}

          <div className="text-center pt-2 text-2xs text-muted-2">
            Issued by <strong className="text-white">{issuedBy}</strong> • Thank you for choosing {salonName}!
          </div>
        </div>

        {/* Action Buttons */}
        <Modal.Actions className="flex flex-wrap gap-2 justify-between">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-surface-2 border border-border hover:bg-surface-3 text-white"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Print Bill
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </Modal.Actions>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
