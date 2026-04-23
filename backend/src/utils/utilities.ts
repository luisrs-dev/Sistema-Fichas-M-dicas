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

export function normalizeDateRange(startDate: string, endDate: string) {
  const normalize = (dateStr: string, isEnd: boolean) => {
    if (!dateStr) return dateStr;

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return isEnd ? `${dateStr}T23:59:59.999Z` : `${dateStr}T00:00:00.000Z`;
    }

    // DD-MM-YYYY (user format in request)
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split("-");
      const iso = `${y}-${m}-${d}`;
      return isEnd ? `${iso}T23:59:59.999Z` : `${iso}T00:00:00.000Z`;
    }

    return dateStr;
  };

  return {
    start: normalize(startDate, false),
    end: normalize(endDate, true),
  };
}