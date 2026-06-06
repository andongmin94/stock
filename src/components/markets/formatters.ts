const krwFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 3,
});

const percentFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `₩${krwFormatter.format(value)}`;
}

export function formatKrwChange(value: number | null) {
  if (value === null) {
    return "-";
  }

  if (value === 0) {
    return "₩0";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}₩${krwFormatter.format(Math.abs(value))}`;
}

export function formatUsd(value: number | null) {
  if (value === null) {
    return "-";
  }

  return usdFormatter.format(value);
}

export function formatChange(value: number | null) {
  if (value === null) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${percentFormatter.format(value * 100)}%`;
}

export function formatTime(timestamp?: number) {
  if (!timestamp) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

export function changeTone(value: number | null) {
  if (value === null || value === 0) {
    return "text-muted-foreground";
  }

  return value > 0 ? "text-[#d92d5c]" : "text-[#2563eb]";
}
