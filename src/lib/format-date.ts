/**
 * Consistent date formatting across the app.
 * Format: "Feb 10, 2026 at 22:03 PT"
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const tz = d
    .toLocaleTimeString("en-US", { timeZoneName: "short" })
    .split(" ")
    .pop();
  return `${month} ${day}, ${year} at ${time} ${tz}`;
}

/** Date-only variant: "Feb 10, 2026" */
export function formatDateShort(date: Date | string | number): string {
  const d = new Date(date);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}
