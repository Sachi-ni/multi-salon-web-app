import React from "react";

const Analytics = () => {
  const metricCards = [
    { label: "Total Bookings", value: "3,847", change: "+18.2%" },
    { label: "Gross Revenue", value: "$427K", change: "+9.8%" },
    { label: "Avg Booking Value", value: "$36.90", change: "+4.1%" },
    { label: "Client Retention", value: "78%", change: "+1.2%" },
  ];

  const topSalons = [
    { name: "Kathura", percentage: 75, colorClass: "pg" },
    { name: "Liyo", percentage: 45, colorClass: "pb" },
    { name: "89", percentage: 35, colorClass: "pr" },
  ];

  const services = [
    { name: "Haircut", percentage: 35, colorClass: "pv" },
    { name: "Hair Color", percentage: 25, colorClass: "pb" },
    { name: "Highlights", percentage: 18, colorClass: "pg" },
    { name: "Blowout", percentage: 12, colorClass: "py" },
    { name: "Other", percentage: 10, colorClass: "pr" },
  ];

  return (
    <div className="page on" id="pg-analytics">

      {/* HEADER */}
      <div className="ph">

        <div>
          <h1>Analytics</h1>
          <p>Platform-wide performance insights</p>
        </div>

      </div>

      {/* METRIC CARDS */}
      <div className="srow mb22">

        {metricCards.map((card, i) => (
          <div className="sc" key={i}>

            <div className="sc-ico">📊</div>

            <div className="sc-lbl">{card.label}</div>

            <div className="sc-val">{card.value}</div>

            <div className="sc-sub up">
              ↑ {card.change}
            </div>

          </div>
        ))}

      </div>

      {/* MIDDLE SECTION */}
      <div className="g2 mb22">

        {/* TOP SALONS */}
        <div className="card">

          <div className="chdr">
            <h3>Top Salons</h3>
            <span className="sub">Revenue share</span>
          </div>

          <div className="fc">

            {topSalons.map((s, i) => (

              <div key={i}>

                <div className="kv">
                  <span className="kvk">{s.name}</span>
                  <span className="kvv">{s.percentage}%</span>
                </div>

                <div className="prog">
                  <div
                    className={`pf ${s.colorClass}`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>

              </div>

            ))}

          </div>

        </div>

        {/* SERVICES */}
        <div className="card">

          <div className="chdr">
            <h3>Service Breakdown</h3>
            <span className="sub">Most used services</span>
          </div>

          <div className="fc">

            {services.map((s, i) => (

              <div key={i}>

                <div className="kv">
                  <span className="kvk">{s.name}</span>
                  <span className="kvv">{s.percentage}%</span>
                </div>

                <div className="prog">
                  <div
                    className={`pf ${s.colorClass}`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* TREND CHART */}
      <div className="card">

        <div className="chdr">
          <h3>Revenue Trend</h3>
          <span className="sub">12 month overview</span>
        </div>

        <div className="rchart">

          {[40, 55, 30, 70, 60, 80, 65, 90, 75, 85, 95, 100].map((h, i) => (

            <div className="rcbw" key={i}>

              <div
                className="rcb"
                style={{ height: `${h}px` }}
              />

              <div className="rcl">
                {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default Analytics;