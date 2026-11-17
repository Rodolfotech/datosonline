import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCEPTED, REJECTED, mayMeasure, readConsent, saveConsent } from "../src/lib/consent.js";

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (key) => (key in data ? data[key] : null), setItem: (key, value) => { data[key] = String(value); } };
}

test("with no choice stored, the visitor has not chosen yet", () => {
  assert.equal(readConsent(fakeStorage()), null);
});

test("a saved choice is read back", () => {
  const storage = fakeStorage();
  saveConsent(storage, ACCEPTED);
  assert.equal(readConsent(storage), ACCEPTED);
  saveConsent(storage, REJECTED);
  assert.equal(readConsent(storage), REJECTED);
});

test("an unknown stored value counts as no choice", () => {
  assert.equal(readConsent(fakeStorage({ "datosonline-cookies": "tal vez" })), null);
});

test("a browser that blocks storage counts as no choice and does not fail", () => {
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.equal(readConsent(blocked), null);
  assert.doesNotThrow(() => saveConsent(blocked, ACCEPTED));
});

test("measurement is allowed only after an explicit acceptance", () => {
  assert.equal(mayMeasure(ACCEPTED), true);
  assert.equal(mayMeasure(REJECTED), false);
  assert.equal(mayMeasure(null), false);
});
