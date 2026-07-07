import React, { useState, useEffect } from "react";
import { getRevenueStats, getSalonRevenue } from "../../services/revenueService";
import { Download, ArrowUpDown, DollarSign, Clock3 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";



const Revenue = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [grossGrowth, setGrossGrowth] = useState(0);
  const [pendingOverdue, setPendingOverdue] = useState(0);
  const [salons, setSalons] = useState([]);
  const [sortDesc, setSortDesc] = useState(true);
  const [period, setPeriod] = useState("30days");

  const formatCurrency = (value) => `Rs. ${Number(value).toLocaleString()}`;

  const fetchData = async () => {
  try {
    setLoading(true);
    setError("");
    const statsRes = await getRevenueStats(period);
    const salonsRes = await getSalonRevenue(period);

    setGrossRevenue(statsRes?.data?.grossRevenue || 0);
    setPendingPayouts(statsRes?.data?.pendingPayouts || 0);
    setGrossGrowth(statsRes?.data?.grossGrowth || 0);
    setPendingOverdue(statsRes?.data?.pendingOverdue || 0);
    setSalons(salonsRes?.data || []);
  } catch (err) {
    console.error(err);
    setError("Failed to load revenue data");
  } finally {
    setLoading(false);
  }
};

useEffect(() => { fetchData(); }, [period]);

  const doExport = () => {
    let csv = "Salon,Revenue,Transactions\n";
    salons.forEach((s) => { csv += `${s.name},${s.revenue},${s.transactions}\n`; });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "revenue.csv";
    link.click();
  };

  const getSortedSalons = () => {
  let filtered = [...salons];
  filtered.sort((a, b) => sortDesc ? b.revenue - a.revenue : a.revenue - b.revenue);
  return filtered;
};

  return (
    <div>
      <PageHeader title="Revenue" subtitle="Financial overview across all salons" backTo="/superAdminDashboard">
        <Button variant="ghost" size="sm" icon={Download} onClick={doExport}>
          Export CSV
        </Button>
      </PageHeader>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner.FullPage />
      ) : (
        <>
          {/* Revenue Cards + Period Filter */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3.5 mb-6">
            <Card>
              <DollarSign className="w-8 h-8 text-accent mb-2" />
              <div className="text-[0.65rem] font-bold tracking-widest uppercase text-muted-2 mb-2">Gross Revenue</div>
              <div className="text-3xl font-black text-white mb-1">{formatCurrency(grossRevenue)}</div>
              <div className="text-xs font-bold text-success">↑ {grossGrowth}%</div>
            </Card>

            <Card>
              <Clock3 className="w-8 h-8 text-accent mb-2" />
              <div className="text-[0.65rem] font-bold tracking-widest uppercase text-muted-2 mb-2">Pending Payouts</div>
              <div className="text-3xl font-black text-white mb-1">{formatCurrency(pendingPayouts)}</div>
              <div className="text-xs font-semibold text-danger">{pendingOverdue} overdue</div>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                variant={period === "30days" ? "primary" : "warning"}
                size="md"
                onClick={() => setPeriod("30days")}
              >
                Last 30 days ▼
              </Button>
              <Button
                variant={period === "year" ? "primary" : "warning"}
                size="md"
                onClick={() => setPeriod("year")}
              >
                This Year ▼
              </Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-white">Revenue by Salon</h3>
            <Button variant="primary" size="sm" icon={ArrowUpDown} onClick={() => setSortDesc(!sortDesc)}>
              Sorted by revenue {sortDesc ? "▼" : "▲"}
            </Button>
          </div>

          {/* Revenue Table */}
          <Table>
            <Table.Head>
              <Table.Th>Salon</Table.Th>
              <Table.Th>Revenue</Table.Th>
              <Table.Th>Transactions</Table.Th>
              <Table.Th>Avg Value</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th align="right">Action</Table.Th>
            </Table.Head>
            <Table.Body>
              {getSortedSalons().length === 0 ? (
                <tr>
                  <Table.Td className="text-center text-muted-2" colSpan="6">
                    No data found
                  </Table.Td>
                </tr>
              ) : (
                getSortedSalons().map((salon, i) => {
                  const avg = salon.transactions > 0 ? salon.revenue / salon.transactions : 0;
                  return (
                    <tr key={i}>
                      <Table.Td bold>{salon.name}</Table.Td>
                      <Table.Td className="text-accent font-semibold">{formatCurrency(salon.revenue)}</Table.Td>
                      <Table.Td>{salon.transactions}</Table.Td>
                      <Table.Td>{formatCurrency(avg)}</Table.Td>
                      <Table.Td><Badge variant="success">{salon.status}</Badge></Table.Td>
                      <Table.Td align="right">
                        <Button variant="ghost" size="xs">Pay Out</Button>
                      </Table.Td>
                    </tr>
                  );
                })
              )}
            </Table.Body>
          </Table>
        </>
      )}
    </div>
  );
};

export default Revenue;