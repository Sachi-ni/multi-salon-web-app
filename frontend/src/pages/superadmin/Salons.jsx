import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Salons = () => {
  const navigate = useNavigate();

  const [loading] = useState(false);
  const [error] = useState("");

  const [salonList] = useState([
    {
      id: 1,
      name: "LIYO",
      owner: "Emma Wilson",
      revenue: "17.3K",
      staff: 7,
      created: "Aug 5, 2022",
      address: "Kadawatha",
    },
    {
      id: 2,
      name: "KATHURA",
      owner: "James Carter",
      revenue: "14.3K",
      staff: 5,
      created: "Oct 9, 2024",
      address: "Nugegoda",
    },
    {
      id: 3,
      name: "89",
      owner: "Sophia Lee",
      revenue: "10.1K",
      staff: 4,
      created: "Feb 5, 2021",
      address: "Kiribathgoda",
    },
  ]);

  return (
    <div className="page on" id="pg-salons">

      {/* HEADER (Revenue style) */}
      <div className="ph">

        <div className="ph-left">

          <button
            className="back-btn"
            onClick={() => navigate("/Dashboard")}
          >
            ←
          </button>

          <div>
            <h1>Salons</h1>
            <p>All registered salon locations</p>
          </div>

        </div>

        <div className="pactions">

          <button
            className="btn btn-p"
            onClick={() => navigate("/AddSalon")}
          >
            + Add Salon
          </button>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-w">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <p>Loading salons...</p>
      ) : (
        <>

          {/* TABLE HEADER */}
          <div className="rev-tbl-hdr">

            <h3>Salon Directory</h3>

            <button className="sort-btn">
              Sorted by name ▼
            </button>

          </div>

          {/* TABLE */}
          <div className="tw">

            <table>

              <thead>

                <tr>

                  <th>Salon</th>
                  <th>Owner</th>
                  <th>Revenue</th>
                  <th>Staff</th>
                  <th>Created</th>
                  <th>Address</th>
                  <th style={{ textAlign: "right" }}>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {salonList.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      No salons found
                    </td>
                  </tr>
                ) : (
                  salonList.map((salon) => (
                    <tr key={salon.id}>

                      <td style={{ fontWeight: 700 }}>
                        {salon.name}
                      </td>

                      <td>{salon.owner}</td>

                      <td style={{ color: "var(--yellow)" }}>
                        Rs. {salon.revenue}
                      </td>

                      <td>{salon.staff}</td>

                      <td>{salon.created}</td>

                      <td>{salon.address}</td>

                      <td style={{ textAlign: "right" }}>

                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>

                          <button className="btn btn-g xs">
                            View
                          </button>

                          <button className="btn btn-c xs">
                            Edit
                          </button>

                          <button className="btn btn-d xs">
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </>
      )}

    </div>
  );
};

export default Salons;