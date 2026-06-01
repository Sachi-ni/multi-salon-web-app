import { createAppointment } from '../../../services/bookingService';
import { useNavigate } from 'react-router-dom';

export default function StepConfirm({ booking, onBack }) {
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await createAppointment({
        salonId: booking.salonId,
        date: booking.date,
        startTime: booking.startTime,
        services: booking.services.map(s => ({
          service: s.serviceId,
          staff: s.staffId,
        })),
      });
      navigate('/customer/bookings'); // or a success page
    } catch (err) {
      alert('Booking failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Confirm Booking</h2>
      <p>Date: {booking.date} at {booking.startTime}</p>
      <ul>
        {booking.services.map(s => (
          <li key={s.serviceId}>{s.serviceName} with {s.staffName}</li>
        ))}
      </ul>
      <button onClick={onBack}>Back</button>
      <button onClick={handleSubmit}>Confirm Booking</button>
    </div>
  );
}