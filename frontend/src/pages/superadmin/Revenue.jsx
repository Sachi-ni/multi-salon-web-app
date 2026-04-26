import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  getRevenueStats,
  getSalonRevenue,
  getMonthlyRevenue
} from "../../services/revenueService";

const Revenue = () => {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [grossRevenue, setGrossRevenue] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [grossGrowth, setGrossGrowth] = useState(0);
  const [pendingOverdue, setPendingOverdue] = useState(0);

  const [salons, setSalons] = useState([]);

  // Format currency
  const formatCurrency = (value) => {
    return `Rs. ${Number(value).toLocaleString()}`;
  };

  // Fetch revenue data
  const fetchData = async () => {

    try {

      setLoading(true);
      setError("");

      const statsRes =
        await getRevenueStats();

      const salonsRes =
        await getSalonRevenue();

      const monthlyRes =
        await getMonthlyRevenue();

      setGrossRevenue(
        statsRes?.data?.grossRevenue || 0
      );

      setPendingPayouts(
        statsRes?.data?.pendingPayouts || 0
      );

      setGrossGrowth(
        statsRes?.data?.grossGrowth || 0
      );

      setPendingOverdue(
        statsRes?.data?.pendingOverdue || 0
      );

      setSalons(
        salonsRes?.data || []
      );

    }
    catch (err) {

      console.error(err);

      setError(
        "Failed to load revenue data"
      );

    }
    finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchData();

  }, []);

  // Export CSV
  const doExport = () => {

    let csv =
      "Salon,Revenue,Transactions\n";

    salons.forEach((s) => {

      csv +=
        `${s.name},${s.revenue},${s.transactions}\n`;

    });

    const blob =
      new Blob([csv], {
        type: "text/csv"
      });

    const link =
      document.createElement("a");

    link.href =
      URL.createObjectURL(blob);

    link.download =
      "revenue.csv";

    link.click();

  };

  return (

    <div className="page on" id="pg-revenue">

      {/* Header */}

      <div className="ph">

        <div className="ph-left">

          <button
            className="back-btn"
            onClick={() =>
              navigate("/Dashboard")
            }
          >
            ←
          </button>

          <div>
            <h1>Revenue</h1>
            <p>
              Financial overview across all salons
            </p>
          </div>

        </div>

        <div className="pactions">

          <button
            className="btn btn-g sm"
            onClick={doExport}
          >
            Export CSV
          </button>

        </div>

      </div>

      {error && (

        <div className="alert alert-w">
          {error}
        </div>

      )}

      {loading ? (

        <p>Loading revenue...</p>

      ) : (

        <>

          {/* TOP CARDS */}

          <div className="rev-top">

            <div className="rev-card">

              <div className="ri">💰</div>

              <div className="rl">
                GROSS REVENUE
              </div>

              <div className="rv">
                {formatCurrency(
                  grossRevenue
                )}
              </div>

              <div className="rc up">
                ↑ {grossGrowth}%
              </div>

            </div>

            <div className="rev-card">

              <div className="ri">⏳</div>

              <div className="rl">
                PENDING PAYOUTS
              </div>

              <div className="rv">
                {formatCurrency(
                  pendingPayouts
                )}
              </div>

              <div className="rs">
                {pendingOverdue} overdue
              </div>

            </div>

            <div className="period-grp">

              <button className="period-btn">
                Last 30 days ▼
              </button>

              <button className="period-btn">
                This Year ▼
              </button>

            </div>

          </div>

          {/* TABLE HEADER */}

          <div className="rev-tbl-hdr">

            <h3>
              Revenue by Salon
            </h3>

            <button className="sort-btn">
              Sorted by revenue ▼
            </button>

          </div>

          {/* TABLE */}

          <div className="tw">

            <table>

              <thead>

                <tr>

                  <th>Salon</th>
                  <th>Revenue</th>
                  <th>Transactions</th>
                  <th>Avg Value</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {salons.length === 0 ? (

                  <tr>

                    <td colSpan="6">
                      No data found
                    </td>

                  </tr>

                ) : (

                  salons.map((salon, i) => {

                    const avg =
                      salon.transactions > 0
                        ? salon.revenue /
                          salon.transactions
                        : 0;

                    return (

                      <tr key={i}>

                        <td>
                          {salon.name}
                        </td>

                        <td style={{
                          color: "var(--yellow)"
                        }}>
                          {formatCurrency(
                            salon.revenue
                          )}
                        </td>

                        <td>
                          {salon.transactions}
                        </td>

                        <td>
                          {formatCurrency(
                            avg
                          )}
                        </td>

                        <td>

                          <span className="pill pg">
                            {salon.status}
                          </span>

                        </td>

                        <td
                          style={{
                            textAlign: "right"
                          }}
                        >

                          <button className="btn btn-g xs">
                            Pay Out
                          </button>

                        </td>

                      </tr>

                    );

                  })

                )}

              </tbody>

            </table>

          </div>

        </>

      )}

    </div>

  );

};

export default Revenue;