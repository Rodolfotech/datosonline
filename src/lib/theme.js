// Pure theme logic: no DOM access, so it can be tested with node --test.

export const THEME_KEY = "datosonline-theme";
export const DARK = "dark";
export const LIGHT = "light";

// The theme to show: the visitor's saved choice, or light by default. The
// system preference is not used: the site always starts in light mode.
export function chooseTheme(saved) {
  return saved === DARK ? DARK : LIGHT;
}

export function nextTheme(theme) {
  return theme === DARK ? LIGHT : DARK;
}

// What the button says: the change it makes.
export function themeButtonLabel(theme) {
  return theme === DARK ? "Activar modo claro" : "Activar modo oscuro";
}
