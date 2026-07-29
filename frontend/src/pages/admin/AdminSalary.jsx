import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";

import { getSalarySummary, getSalaries, upsertMonthlySalary, generateMonthForSalon } from "../../services/salaryService";

import { motion } from "framer-motion";
import { Loader2, Wallet, CalendarDays, Users } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./admin.css";

const formatMoney = (value) => {
  const num = Number(value || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `$${num.toLocaleString()}`;
  }
};



const toMonthKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const Salary = () => {
  const { salonId: routeSalonId } = useParams();
  const { user } = useAuth();
  const salonId = routeSalonId || user?.salon_id || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    grossRevenue: 0,
    grossGrowth: 0,
    pendingPayouts: 0,
    pendingOverdue: 0,
  });

  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [salaries, setSalaries] = useState([]);

  // Track commission + status edits locally by staffId
  const [drafts, setDrafts] = useState({});

  const payPeriodLabel = useMemo(() => {
    const [y, mm] = month.split("-");
    const date = new Date(Number(y), Number(mm) - 1, 1);
    return date.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [month]);

  const syncDraftsFromServer = (rows) => {
    const next = {};
    for (const r of rows) {
      next[r.staff_id?._id || r.staff_id || r._id] = {
        commission: r.commission ?? 0,
        status: r.status ?? "Not Paid",
        workHours: r.work_hours ?? r.workHours ?? 1,
      };
    }
    setDrafts(next);
  };

  const load = async (targetMonth = month) => {
    setLoading(true);
    setError("");

    try {
      const requestParams = { month: targetMonth };
      if (salonId) {
        requestParams.salonId = salonId;
      }

      // Summary uses revenue stats; keep it as existing UI
      try {
        const res = await getSalarySummary(salonId ? { salonId } : {});
        const data = res.data || {};
        setSummary({
          grossRevenue: data.grossRevenue ?? 0,
          grossGrowth: data.grossGrowth ?? 0,
          pendingPayouts: data.pendingPayouts ?? 0,
          pendingOverdue: data.pendingOverdue ?? 0,
        });
      } catch {
        // ignore summary failures
      }

      // Ensure month rows exist
      try {
        await generateMonthForSalon({ month: targetMonth, salonId });
      } catch {
        // ignore generation failures (backend may already have rows)
      }

      const listRes = await getSalaries(requestParams);
      const rows = listRes?.data?.salaries || [];
      setSalaries(rows);
      syncDraftsFromServer(rows);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load salary data");
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const handleSave = async (row, nextStatus = null) => {
    const staffId = row.staff_id?._id || row.staff_id;
    const draftKey = staffId || row._id;

    const draft = drafts[draftKey] || { commission: 0, status: "Not Paid", workHours: 1 };

    setLoading(true);
    setError("");

    try {
      const commission = Number(draft.commission || 0);
      const workHours = Number(draft.workHours || 1);
      const status = nextStatus || (draft.status === "Paid" ? "Paid" : "Not Paid");

      // Backend recalculates total = basic * workHours + commission and updates basic snapshot.
      await upsertMonthlySalary({
        staffId,
        month,
        commission,
        workHours,
        status,
        salonId,
      });

      await load(month);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to save salary" );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh]">
      <PageHeader title="Salary & Payroll" subtitle={`Month: ${payPeriodLabel}`} backTo={`/salon-admin/${salonId}/adminDashboard`}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-muted-2 uppercase tracking-wider">Pay Month</label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9"
            />
          </div>
          <Button
            variant="primary"
            icon={loading ? Loader2 : CalendarDays}
            onClick={() => load(month)}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl border border-danger-dim bg-danger-dim text-white text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="admin-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-2 uppercase tracking-wider">Gross Revenue</div>
                <div className="mt-1 text-2xl font-black text-white">{formatMoney(summary.grossRevenue)}</div>
              </div>
              <Wallet className="w-5 h-5 text-accent" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="admin-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-2 uppercase tracking-wider">Growth</div>
                <div className="mt-1 text-2xl font-black text-white">{Number(summary.grossGrowth || 0)}%</div>
              </div>
              <CalendarDays className="w-5 h-5 text-accent" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="admin-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-2 uppercase tracking-wider">Pending Payouts</div>
                <div className="mt-1 text-2xl font-black text-white">{formatMoney(summary.pendingPayouts)}</div>
              </div>
              <Users className="w-5 h-5 text-accent" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="admin-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-2 uppercase tracking-wider">Overdue</div>
                <div className="mt-1 text-2xl font-black text-white">{summary.pendingOverdue}</div>
              </div>
              <Wallet className="w-5 h-5 text-accent" />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="mt-6">
        <Card>
          <Card.Header>
            <Card.Title>Staff Salary</Card.Title>
          </Card.Header>

          {loading ? (
            <div className="p-6 flex items-center gap-3 text-muted-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading payroll...
            </div>
          ) : salaries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No payroll records"
                description="No salary rows found for this month (or staff list is empty)."
                icon={Wallet}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Services</th>
                    <th>Basic Salary</th>
                    <th>Work Hours</th>
                    <th>Commission</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((row) => {
                    const staffId = row.staff_id?._id || row.staff_id;
                    const key = staffId || row._id;
                    const draft = drafts[key] || { commission: 0, status: "Not Paid", workHours: 1 };

                    const commission = Number(draft.commission || 0);
                    const workHours = Number(draft.workHours || 1);
                    const basic = Number(row.base_salary || 0);
                    const total = basic * workHours + commission;

                    return (
                      <tr key={row._id || key}>
                        <td className="min-w-[180px]">
                          <div className="font-bold text-white">{row.full_name || "—"}</div>
                          <div className="text-sm text-muted-2">{row.role || "—"}</div>
                        </td>
                        <td className="min-w-[240px]">
                          <div className="text-sm text-muted-2">
                            {(row.servicesSnapshot || []).length === 0 ? (
                              <span>—</span>
                            ) : (
                              <ul className="list-disc pl-5 space-y-1">
                                {row.servicesSnapshot.slice(0, 6).map((s) => (
                                  <li key={s.service_id || s.service_name}>
                                    {s.service_name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-sm">{formatMoney(basic)}</td>
                        <td className="min-w-[140px]">
                          <Input
                            type="number"
                            value={draft.workHours}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setDrafts((prev) => ({
                                ...prev,
                                [key]: { ...(prev[key] || {}), workHours: Number.isFinite(v) && v >= 0 ? v : 1 },
                              }));
                            }}
                            className="h-9"
                          />
                        </td>
                        <td className="min-w-[140px]">
                          <Input
                            type="number"
                            value={draft.commission}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setDrafts((prev) => ({
                                ...prev,
                                [key]: { ...(prev[key] || {}), commission: Number.isFinite(v) ? v : 0 },
                              }));
                            }}
                            className="h-9"
                          />
                        </td>
                        <td className="whitespace-nowrap text-sm font-bold text-accent">{formatMoney(total)}</td>
                        <td className="min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nextDraft = { ...(drafts[key] || {}), status: "Paid" };
                                setDrafts((prev) => ({
                                  ...prev,
                                  [key]: nextDraft,
                                }));
                                handleSave({ ...row, status: "Paid" }, "Paid");
                              }}
                              className={`h-9 rounded-md px-3 text-sm font-semibold border transition-colors ${
                                draft.status === "Paid"
                                  ? "bg-success-dim text-success border-success-border"
                                  : "bg-transparent text-white border-border hover:border-accent"
                              }`}
                              disabled={loading}
                            >
                              Paid
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextDraft = { ...(drafts[key] || {}), status: "Not Paid" };
                                setDrafts((prev) => ({
                                  ...prev,
                                  [key]: nextDraft,
                                }));
                                handleSave({ ...row, status: "Not Paid" }, "Not Paid");
                              }}
                              className={`h-9 rounded-md px-3 text-sm font-semibold border transition-colors ${
                                draft.status === "Not Paid"
                                  ? "bg-accent-dim text-accent border-accent-muted"
                                  : "bg-transparent text-white border-border hover:border-accent"
                              }`}
                              disabled={loading}
                            >
                              Not Paid
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pt-4 mt-2 border-t border-border flex justify-end gap-6 px-4">
                <span className="text-sm text-muted-2">
                  Base Total:{" "}
                  <strong className="text-white">
                    {formatMoney(
                      salaries.reduce((sum, s) => {
                        const staffId = s.staff_id?._id || s.staff_id;
                        const key = staffId || s._id;
                        const d = drafts[key] || { workHours: s.work_hours || s.workHours || 1 };
                        const workHours = Number(d.workHours || 1);
                        return sum + Number(s.base_salary || 0) * workHours;
                      }, 0)
                    )}
                  </strong>
                </span>
                <span className="text-sm text-muted-2">
                  Commission Total:{" "}
                  <strong className="text-white">
                    {formatMoney(
                      salaries.reduce((sum, s) => {
                        const staffId = s.staff_id?._id || s.staff_id;
                        const key = staffId || s._id;
                        const d = drafts[key] || { commission: s.commission || 0 };
                        return sum + Number(d.commission || 0);
                      }, 0)
                    )}
                  </strong>
                </span>
                <span className="text-sm text-muted-2">
                  Total Payout:{" "}
                  <strong className="text-accent text-[15px]">
                    {formatMoney(
                      salaries.reduce((sum, s) => {
                        const staffId = s.staff_id?._id || s.staff_id;
                        const key = staffId || s._id;
                        const d = drafts[key] || { commission: s.commission || 0, workHours: s.work_hours || s.workHours || 1 };
                        const basic = Number(s.base_salary || 0);
                        const commission = Number(d.commission || 0);
                        const workHours = Number(d.workHours || 1);
                        return sum + basic * workHours + commission;
                      }, 0)
                    )}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Salary;

