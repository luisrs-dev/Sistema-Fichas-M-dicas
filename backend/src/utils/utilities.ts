export function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function getChileYMD(dateInput: string | Date): string | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;

  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
}

export function normalizeDateRange(startDate: string, endDate: string) {
  const parseYMD = (dateStr: string): string | null => {
    if (!dateStr) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split("-");
      return `${y}-${m}-${d}`;
    }

    if (dateStr.includes("T")) {
      return getChileYMD(dateStr);
    }

    return null;
  };

  const startYMD = parseYMD(startDate) || startDate;
  const endYMD = parseYMD(endDate) || endDate;

  const start = startYMD.length === 10 ? `${startYMD}T00:00:00.000Z` : startDate;

  let end = endDate;
  if (endYMD.length === 10) {
    const [y, m, d] = endYMD.split("-").map(Number);
    const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
    const nextY = nextDay.getUTCFullYear();
    const nextM = String(nextDay.getUTCMonth() + 1).padStart(2, "0");
    const nextD = String(nextDay.getUTCDate()).padStart(2, "0");
    end = `${nextY}-${nextM}-${nextD}T23:59:59.999Z`;
  }

  return {
    start,
    end,
    startYMD,
    endYMD,
  };
}