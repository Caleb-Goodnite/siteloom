import { describe, expect, it } from "vitest";
import { CARD_REMOVED, redactSubmission, redactValue, SSN_REMOVED } from "@/lib/site/redact";

describe("form submission redaction", () => {
  it("removes card numbers in common formats", () => {
    expect(redactValue("message", "my card is 4242 4242 4242 4242 thanks")).toBe(`my card is ${CARD_REMOVED} thanks`);
    expect(redactValue("message", "5555-5555-5555-4444")).toBe(CARD_REMOVED);
    expect(redactValue("message", "378282246310005")).toBe(CARD_REMOVED);
  });

  it("removes formatted Social Security numbers", () => {
    expect(redactValue("message", "SSN 123-45-6789")).toBe(`SSN ${SSN_REMOVED}`);
    expect(redactValue("notes", "123 45 6789")).toBe(SSN_REMOVED);
  });

  it("removes bare 9-digit numbers only in SSN-like fields", () => {
    expect(redactValue("ssn", "123456789")).toBe(SSN_REMOVED);
    expect(redactValue("social_security", "123456789")).toBe(SSN_REMOVED);
    expect(redactValue("order number", "123456789")).toBe("123456789");
  });

  it("keeps everyday contact details", () => {
    const data = {
      name: "Jane Doe",
      phone: "(614) 555-0142",
      intl: "+44 20 7946 0958",
      zip: "43215-1234",
      message: "Quote for 2,400 sq ft driveway, card 4000056655665556 by mistake? no, ref 1234567890123",
    };
    const out = redactSubmission(data);
    expect(out.name).toBe("Jane Doe");
    expect(out.phone).toBe(data.phone);
    expect(out.intl).toBe(data.intl);
    expect(out.zip).toBe(data.zip);
    // 16-digit Luhn-valid number is treated as a card; a 13-digit non-Luhn reference is kept.
    expect(out.message).toContain(CARD_REMOVED);
    expect(out.message).toContain("1234567890123");
  });
});
