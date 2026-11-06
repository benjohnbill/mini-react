import { expect, test } from "vitest";

// Confirms that Vitest runs TypeScript with a DOM. Delete this file when real tests exist.
test("the test environment has a DOM", () => {
  const element = document.createElement("p");
  element.textContent = "hi";

  expect(element.outerHTML).toBe("<p>hi</p>");
});
