// Timezone-safe date parsing for content strings.
//
// `new Date("2026-06-02")` parses as UTC midnight, so when the user
// is west of UTC (e.g. Mesa, AZ = UTC-7) `toLocaleDateString` formats
// it as the PREVIOUS calendar day. Every place that renders a
// YYYY-MM-DD field needs to go through this helper instead.
//
// Full ISO strings with a time + offset (e.g. "2026-06-01T12:48:00-07:00")
// parse correctly on their own, so we pass those straight through.
// We anchor date-only strings at LOCAL NOON so the formatted day
// matches what was entered in the CMS regardless of DST edges.

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const m = DATE_ONLY_RE.exec(value);
  if (m) {
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      12 // noon, not midnight — DST-safe
    );
  }
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatLocalDate(
  value: string,
  options: Intl.DateTimeFormatOptions
): string {
  const dt = parseLocalDate(value);
  return dt ? dt.toLocaleDateString("en-US", options) : "";
}
