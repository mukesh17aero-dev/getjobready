import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PassportLinkButton } from "@/features/profile";

// A "use client" component with a click handler this test setup cannot
// drive (no jsdom here) - this covers the initial render only.

describe("Passport link button", () => {
  it("renders as an offer, not a pre-filled value - nothing changes until clicked", () => {
    const html = renderToStaticMarkup(createElement(PassportLinkButton, { onFound: () => {} }));
    expect(html).toContain("Use my Career Passport link instead");
    expect(html).not.toContain("You don&apos;t have a shareable Passport yet");
  });
});
