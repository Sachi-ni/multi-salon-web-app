import { useState } from "react";

import SalonSelect from "../../components/booking/SalonSelect";
import ServiceSelect from "../../components/booking/ServiceSelect";
import DateSelect from "../../components/booking/DateSelect";
import SlotSelect from "../../components/booking/SlotSelect";

export default function BookingPage() {
  const [step, setStep] = useState(1);

  const [salon, setSalon] = useState(null);
  const [service, setService] = useState(null);
  const [date, setDate] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h1>Book Appointment</h1>

      {/* STEP 1 */}
      {step === 1 && (
        <SalonSelect
          onSelect={(s) => {
            setSalon(s);
            setStep(2);
          }}
        />
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <ServiceSelect
          salon={salon}
          onSelect={(s) => {
            setService(s);
            setStep(3);
          }}
        />
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <DateSelect
          onSelect={(d) => {
            setDate(d);
            setStep(4);
          }}
        />
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <SlotSelect
          salon={salon}
          service={service}
          date={date}
        />
      )}
    </div>
  );
}