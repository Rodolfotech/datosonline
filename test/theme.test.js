import assert from "node:assert/strict";
import { test } from "node:test";
import { DARK, LIGHT, chooseTheme, nextTheme, themeButtonLabel } from "../src/lib/theme.js";

test("a saved choice is used", () => {
  assert.equal(chooseTheme(LIGHT), LIGHT);
  assert.equal(chooseTheme(DARK), DARK);
});

test("without a saved choice, the site starts in light mode, whatever the system says", () => {
  assert.equal(chooseTheme(null), LIGHT);
  assert.equal(chooseTheme("otro"), LIGHT);
});

test("the toggle switches between the two themes", () => {
  assert.equal(nextTheme(LIGHT), DARK);
  assert.equal(nextTheme(DARK), LIGHT);
});

test("the button says the change it makes", () => {
  assert.equal(themeButtonLabel(LIGHT), "Activar modo oscuro");
  assert.equal(themeButtonLabel(DARK), "Activar modo claro");
});
