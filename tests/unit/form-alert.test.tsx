// The error summary that sits above a form.
//
// It exists because the resume studio and the interview setup both reported a
// missing answer at the very bottom of a long two-column page: the person saw
// a button that did nothing and no reason why, and on a phone the reason was
// off screen entirely.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormAlert } from "@/components/ui/form-alert";
import { RequiredMark } from "@/components/ui/required-mark";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("the form alert", () => {
  it("renders nothing when there is nothing wrong", () => {
    expect(html(createElement(FormAlert, { message: null }))).toBe("");
    expect(html(createElement(FormAlert, { message: "" }))).toBe("");
  });

  it("announces itself, so it is not just a red box someone has to notice", () => {
    const out = html(createElement(FormAlert, { message: "Name the role you are aiming at." }));
    expect(out).toContain('role="alert"');
    expect(out).toContain('aria-live="assertive"');
    expect(out).toContain("Name the role you are aiming at.");
  });

  it("is focusable, so focus can be moved to it and the next Tab lands on the fix", () => {
    expect(html(createElement(FormAlert, { message: "Something is missing." }))).toContain('tabindex="-1"');
  });

  it("offers each missing field as a shortcut rather than describing it", () => {
    const out = html(createElement(FormAlert, {
      message: "A few details are needed.",
      missing: [
        { id: "resume-track", label: "Where are you right now?" },
        { id: "resume-role", label: "Target role" },
      ],
    }));
    expect(out).toContain("Where are you right now?");
    expect(out).toContain("Target role");
    expect((out.match(/<button/g) ?? []).length).toBe(2);
  });

  it("is a plain message when no field is named", () => {
    const out = html(createElement(FormAlert, { message: "That didn't save. Try again." }));
    expect(out).not.toContain("<button");
  });
});

describe("the required mark", () => {
  it("hides the asterisk from screen readers and gives them the word instead", () => {
    const out = html(createElement(RequiredMark));
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain("*");
    expect(out).toContain("(required)");
  });

});
