import { useEffect, useState } from "react";
import { getAvailability, bookAppointment } from "../../services/bookingService";

export default function SlotSelect({ salon, service, date }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await getAvailability(
        salon._id,
        service._id,
        date
      );

      setData(res);
    };

    if (salon && service && date) load();
  }, [salon, service, date]);

  const handleBook = async (staff_id, slot) => {
    await bookAppointment({
      salon_id: salon._id,
      service_id: service._id,
      staff_id,
      date,
      start_time: slot,
      customer_id: null,
    });

    alert("Booked successfully!");
  };

  return (
    <div>
      <h2>Available Slots</h2>

      {data.map((staff) => (
        <div key={staff.staff_id}>
          <h3>{staff.staff_name}</h3>

          {staff.slots.map((slot) => (
            <button
              key={slot}
              onClick={() => handleBook(staff.staff_id, slot)}
            >
              {slot}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}