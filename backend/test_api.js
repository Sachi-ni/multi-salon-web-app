async function test() {
  try {
    const staffId = "6a240a17caac4fd9a39a3f0b"; // From check_slots.js
    const date = "2026-06-30";
    const serviceId = "6a240a11caac4fd9a39a3eed";
    const salonId = "6a240a10caac4fd9a39a3ee6";

    const res = await fetch(`http://localhost:5000/api/appointments/available-slots?staffId=${staffId}&date=${date}&serviceId=${serviceId}&salonId=${salonId}`);
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
