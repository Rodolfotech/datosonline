// Keeps the GitHub token only for this browser tab: sessionStorage is erased
// when the tab is closed and is never sent anywhere or saved to the site.
const TOKEN_KEY = "datosonline-panel-token";

export function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Without storage the session still works until the page is reloaded.
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing was stored.
  }
}
