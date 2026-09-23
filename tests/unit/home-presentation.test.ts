import { expect, it } from "vitest";
import { pickupReason } from "@/features/journey";
it("keeps one sentence from a recommendation without appending the rest", () => {
  expect(pickupReason("Add your completed customer service work to your record. The gaps remain until you do.")).toBe("Add your completed customer service work to your record.");
});
it("drops an appended explanation and inline emphasis without changing the ask", () => {
  expect(pickupReason("Prepare an introduction about what draws *you* to this work - not why the company is good, but what you need. This sets the tone.")).toBe("Prepare an introduction about what draws you to this work.");
});
