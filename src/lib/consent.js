// Pure consent logic: no DOM access, so it can be tested with node --test.
// The visitor's choice is kept in the browser. Without a choice, nothing
// that measures visits is loaded.

export const CONSENT_KEY = "datosonline-cookies";
export const ACCEPTED = "accepted";
export const REJECTED = "rejected";

// The stored choice, or null when the visitor has not chosen yet or the
// browser does not allow storage.
export function readConsent(storage) {
  try {
    const value = storage.getItem(CONSENT_KEY);
    return value === ACCEPTED || value === REJECTED ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(storage, choice) {
  try {
    storage.setItem(CONSENT_KEY, choice);
  } catch {
    // Without storage the choice lasts until the page is closed.
  }
}

// Measurement tools load only after an explicit "accepted".
export function mayMeasure(choice) {
  return choice === ACCEPTED;
}
