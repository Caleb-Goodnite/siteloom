/**
 * Removes data that must never sit in form submissions, before they're stored or emailed:
 * payment card numbers (13–19 digits that pass the Luhn check) and Social Security numbers.
 * Forms aren't meant to collect these (see the Acceptable Use Policy); this catches visitors
 * who type them anyway, so a leaked inbox or database never holds them.
 */
export const CARD_REMOVED = "[card number removed]";
export const SSN_REMOVED = "[SSN removed]";

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

const CARD = /(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)/g;
const SSN = /(?<!\d)\d{3}[- ]\d{2}[- ]\d{4}(?!\d)/g;
const SSN_FIELD = /\b(ssn|social[\s_-]*security|tax[\s_-]*id|tin|itin)\b/i;

export function redactValue(key: string, value: string) {
  let out = value.replace(CARD, (m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 13 && luhn(digits) ? CARD_REMOVED : m;
  });
  out = out.replace(SSN, SSN_REMOVED);
  // A bare 9-digit number in a field labelled like an SSN.
  if (SSN_FIELD.test(key.replace(/_/g, " "))) out = out.replace(/(?<!\d)\d{9}(?!\d)/g, SSN_REMOVED);
  return out;
}

export function redactSubmission(data: Record<string, string>) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, redactValue(k, v)]));
}
