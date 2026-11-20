// Applies the theme and handles the sun button in the navbar.
import { THEME_KEY, chooseTheme, nextTheme, themeButtonLabel } from "./lib/theme.js";

// Some browsers block storage; then the choice lasts only for this page.
function storage() {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

function currentTheme() {
  let saved = null;
  try {
    saved = storage().getItem(THEME_KEY);
  } catch {
    // Treated as no saved choice.
  }
  return chooseTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  for (const button of document.querySelectorAll("[data-theme-toggle]")) {
    button.setAttribute("aria-label", themeButtonLabel(theme));
    button.title = themeButtonLabel(theme);
  }
}

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-theme-toggle]")) return;
  const theme = nextTheme(document.documentElement.dataset.theme);
  try {
    storage().setItem(THEME_KEY, theme);
  } catch {
    // The theme still changes for this visit.
  }
  applyTheme(theme);
});

applyTheme(currentTheme());
