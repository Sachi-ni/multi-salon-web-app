import { useEffect, useState } from "react";
import { getSalons } from "../../services/bookingService";

const SalonSelect = ({ onSelect }) => {
  const [salons, setSalons] = useState([]);

  useEffect(() => {
    const fetchSalons = async () => {
      const data = await getSalons();
      setSalons(data);
    };
    fetchSalons();
  }, []);

  return (
    <div>
      {salons.map((salon) => (
        <div
          key={salon._id}
          onClick={() => onSelect(salon)} // 👈 IMPORTANT
          style={{ cursor: "pointer", margin: 10 }}
        >
          {salon.name}
        </div>
      ))}
    </div>
  );
};

export default SalonSelect;