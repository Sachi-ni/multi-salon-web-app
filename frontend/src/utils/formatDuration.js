export const formatDuration = (minutes) => {
  const totalMinutes = Number(minutes) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const parts = [];

  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes} Min`);

  return parts.join(" ") || "0 Min";
};
