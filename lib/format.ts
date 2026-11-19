const numberFormat = new Intl.NumberFormat("id-ID");
const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatNumber(value: number | null | undefined): string {
  return numberFormat.format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Belum tersedia";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Belum tersedia";
  }
  return dateFormat.format(date);
}
