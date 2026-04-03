import React from "react";
import { useNavigate } from "react-router-dom";

const Revenue = () => {
  const navigate = useNavigate();

  const doExport = () => {
    console.log("Export clicked");
  };

  const nav = (page) => {
    navigate(`/${page}`);
  };

  const toast = (msg) => {
    console.log(msg);
  };

  return (
    <div className="page" id="pg-revenue" style={{ color: 'white', backgroundColor: 'black', padding: '20px', minHeight: '100vh' }}>

      {/* Header */}
      <div className="ph">
        <div className="ph-left">

          <button
            className="back-btn"
            onClick={() => nav("Dashboard")}
            title="Back to Dashboard"
          >
            ←
          </button>

          <div>
            <h1>Revenue</h1>
            <p>Financial overview across all salons</p>
          </div>
        </div>

        <div className="pactions">
          <button className="btn btn-g sm" onClick={doExport}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="rev-top">

        <div className="rev-card">
          <div className="ri">💰</div>
          <div className="rl">Gross Revenue</div>
          <div className="rv" id="rev-gross">Rs. 120,000</div>
          <div className="rc up">↑ 12.4%</div>
        </div>

        <div className="rev-card">
          <div className="ri">⏳</div>
          <div className="rl">Pending Payouts</div>
          <div className="rv">Rs. 6.3K</div>
          <div className="rs">3 overdue</div>
        </div>

        <div className="period-grp">
          <button
            className="period-btn"
            onClick={() => toast("Last 30 days selected")}
          >
            Last 30 days ▼
          </button>

          <button
            className="period-btn"
            onClick={() => toast("This year selected")}
          >
            This Year ▼
          </button>
        </div>

      </div>

      {/* Table Header */}
      <div className="rev-tbl-hdr">
        <h3>Revenue by Salon</h3>
        <button className="sort-btn">
          Sorted by revenue ▼
        </button>
      </div>

      {/* Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Salon</th>
              <th>Revenue</th>
              <th>Transactions</th>
              <th>Avg Value</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>

          <tbody id="revtb">
            {/* Example row */}
            <tr>
              <td>Salon A</td>
              <td>Rs. 25,000</td>
              <td>120</td>
              <td>Rs. 208</td>
              <td>Active</td>
              <td style={{ textAlign: "right" }}>
                <button className="btn btn-g sm">View</button>
              </td>
            </tr>
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default Revenue;