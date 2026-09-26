export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCycle(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export function formatClock(timestamp: string | null | undefined) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

export function formatCountdown(totalSeconds: number | null | undefined) {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds <= 0) return "—";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, "0")).join(":");
}
