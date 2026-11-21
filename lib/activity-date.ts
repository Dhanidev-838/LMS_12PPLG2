const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function activityDate(value: Date): Date {
  const parts = formatter.formatToParts(value);
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(number("year"), number("month") - 1, number("day")));
}
