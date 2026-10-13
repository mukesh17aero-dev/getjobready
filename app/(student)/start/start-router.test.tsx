import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { StartRouter } from "./start-router";

it("keeps the preparation path out of the initial home page", () => {
  const html = renderToStaticMarkup(createElement(StartRouter, {
    initialState: { routes: [], current: null },
  }));

  expect(html).toContain('aria-controls="full-path"');
  expect(html).toContain("Show your preparation path");
  expect(html).toContain('aria-expanded="false"');
  expect(html).not.toContain("Your preparation path");
  expect(html).not.toContain("Explore the role");
});
