/**
 * Formats a numeric position into an ordinal string representation.
 * Examples: 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11 -> "11th", 21 -> "21st".
 */
export function formatOrdinal(num: number): string {
  if (!num || num <= 0) return "N/A";
  const cent = num % 100;
  if (cent >= 11 && cent <= 13) return `${num}th`;
  switch (num % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}
