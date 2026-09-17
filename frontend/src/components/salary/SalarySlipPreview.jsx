import React from "react";
import { Download, Printer } from "lucide-react";

const formatMoney = (value) =>
  `LKR ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "N/A";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const SalarySlipPreview = ({ salary, onClose, onDownload }) => {
  if (!salary) return null;

  const staff = salary.staff_id || {};
  const salon = salary.salon_id || {};
  const frequency = salary.frequency || "daily";
  const frequencyLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1);
  const services = Array.isArray(staff.services) ? staff.services : [];
  const records = Array.isArray(salary.dailyRecords) ? salary.dailyRecords : [];
  const displayRecords = records.length ? records : [{ date: salary.period, workingAmount: 0, rate: salary.rate || 0, workRate: 0, daySalary: 0 }];
  const getDisplayedSalary = (row) => frequency === "weekly" || frequency === "monthly"
    ? Number(row.daySalary || 0)
    : Number(row.daySalary ?? row.workRate ?? 0);
  const totalWorkingAmount = displayRecords.reduce((sum, row) => sum + Number(row.workingAmount || 0), 0);
  const totalWorkRate = displayRecords.reduce((sum, row) => sum + Number(row.workRate || 0), 0);
  const totalSalary = displayRecords.reduce((sum, row) => sum + getDisplayedSalary(row), 0);
  const period = frequency === "weekly"
    ? `${formatDate(salary.dateRange?.start || salary.period)} - ${formatDate(salary.dateRange?.end || salary.period)}`
    : salary.period || formatDate(salary.dateRange?.start);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((node) => node.outerHTML).join("");
    printWindow.document.write(`<html><head><title>Salary Payslip</title>${styles}<style>body{font-family:Arial,sans-serif;padding:24px;color:#111;background:#fff}.slip{max-width:800px;margin:auto}button{display:none!important}@media print{body{padding:0}}</style></head><body><div class="slip">${document.getElementById("salary-slip-content")?.outerHTML || ""}</div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="flex flex-col gap-4">
      <div id="salary-slip-content" className="bg-white text-[#111827] rounded-sm shadow-2xl overflow-hidden">
        <div className="px-5 sm:px-8 pt-5 pb-4 border-b-2 border-[#2f6bd9]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{salon.name || "Tom Salon"}</h1>
              <p className="mt-1 text-sm text-gray-500">{salon.location || "Salon"}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2f6bd9]">PAYSLIP</h2>
              <p className="mt-1 text-sm text-gray-500">{frequencyLabel} Pay Period</p>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-sm sm:text-base">
          <InfoRow label="Employee Name" value={staff.full_name || staff.name || salary.staff_name || "N/A"} />
          <InfoRow label="Pay Period" value={period} />
          <InfoRow label="Email" value={staff.email || "N/A"} />
          <InfoRow label="Payment Type" value={frequencyLabel} />
          <InfoRow label="Payment Status" value={salary.status || "Paid"} valueClass="text-emerald-600 font-bold" />
          <InfoRow label="Paid Date" value={formatDate(salary.paidAt || salary.updatedAt)} />
        </div>

        <SlipSection title="SERVICES ASSIGNED">
          <table className="w-full text-sm sm:text-base"><thead><tr className="bg-gray-100"><th className="text-left px-4 py-3">Service Name</th><th className="text-right px-4 py-3">Amount</th></tr></thead><tbody>
            {(services.length ? services : [{ service_name: "No services assigned", base_price: 0 }]).map((service, index) => (
              <tr key={`${service.service_name || service.name}-${index}`} className="border-b border-gray-200"><td className="px-4 py-3">{service.service_name || service.name || "Service"}</td><td className="px-4 py-3 text-right">{formatMoney(service.base_price ?? service.price)}</td></tr>
            ))}
          </tbody></table>
        </SlipSection>

        <SlipSection title="DAILY RECORDS">
          <table className="w-full text-sm sm:text-base"><thead><tr className="bg-gray-100"><th className="text-left px-4 py-3">Day</th><th className="text-right px-4 py-3">Amount</th><th className="text-center px-4 py-3">Rate %</th><th className="text-right px-4 py-3">Work Rate</th><th className="text-right px-4 py-3">{frequency === "weekly" || frequency === "monthly" ? "Day Salary" : "Salary"}</th></tr></thead><tbody>
            {displayRecords.map((row, index) => (
              <tr key={`${row.date || "record"}-${index}`} className="border-b border-gray-200"><td className="px-4 py-3">{frequency === "weekly" ? new Date(row.date).toLocaleDateString(undefined, { weekday: "short" }) : formatDate(row.date)}</td><td className="px-4 py-3 text-right">{formatMoney(row.workingAmount)}</td><td className="px-4 py-3 text-center">{Number(row.rate || salary.rate || 0)}%</td><td className="px-4 py-3 text-right">{formatMoney(row.workRate)}</td><td className="px-4 py-3 text-right">{formatMoney(getDisplayedSalary(row))}</td></tr>
            ))}
          </tbody></table>
        </SlipSection>

        <SlipSection title="PAYMENT SUMMARY">
          <SummaryRow label="Total Working Amount" value={formatMoney(totalWorkingAmount)} />
          <SummaryRow label="Total Work Rate" value={formatMoney(totalWorkRate)} />
          <SummaryRow label="TOTAL SALARY" value={formatMoney(totalSalary)} emphasized />
        </SlipSection>

        <div className="px-5 sm:px-8 py-5 mt-2 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-500">
          This is a computer-generated payslip. No signature required.<br />
          Generated on: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#2c2c2c] pt-4">
        <button onClick={onClose} className="px-5 py-3 rounded-lg border border-[#303030] bg-[#1a1a1a] text-white font-bold text-sm">CLOSE</button>
        <button onClick={handlePrint} className="px-5 py-3 rounded-lg border border-[#303030] bg-[#1a1a1a] text-white font-bold text-sm flex items-center gap-2"><Printer className="w-4 h-4 text-yellow-400" /> PRINT BILL</button>
        <button onClick={onDownload} className="px-5 py-3 rounded-lg bg-[#ffbd21] text-black font-extrabold text-sm flex items-center gap-2"><Download className="w-4 h-4" /> DOWNLOAD PDF</button>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, valueClass = "" }) => <div className="grid grid-cols-[minmax(110px,1fr)_minmax(0,1.5fr)] gap-3 py-2 border-b border-gray-200"><span className="font-bold">{label}</span><span className={valueClass}>{value}</span></div>;
const SlipSection = ({ title, children }) => <section className="px-5 sm:px-8 mt-4"><h3 className="bg-[#364152] text-white px-1 py-2 text-lg font-bold">{title}</h3>{children}</section>;
const SummaryRow = ({ label, value, emphasized }) => <div className={`flex justify-between gap-4 px-4 py-3 border-b border-gray-200 ${emphasized ? "bg-blue-50 border-t-2 border-[#364152] text-lg font-extrabold text-[#2f6bd9]" : ""}`}><span className={emphasized ? "text-gray-900" : ""}>{label}</span><span>{value}</span></div>;

export default SalarySlipPreview;
