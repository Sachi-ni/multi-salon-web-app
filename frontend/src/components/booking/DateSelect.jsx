export default function DateSelect({ onSelect }) {
  return (
    <div>
      <h2>Select Date</h2>

      <input
        type="date"
        onChange={(e) => onSelect(e.target.value)}
        style={{ padding: "10px", marginTop: "10px" }}
      />
    </div>
  );
}