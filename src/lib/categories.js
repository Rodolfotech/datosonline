// Pure category logic: no DOM access, so it can be tested with node --test.

const CATEGORY_PARAM = "categoria";

// Returns the slug of the active category, or "" when showing all products.
export function getActiveCategorySlug(search, categories) {
  const slug = new URLSearchParams(search).get(CATEGORY_PARAM) ?? "";
  return categories.some((category) => category.slug === slug) ? slug : "";
}

// Relative URLs, so the links also work when the site is published in a
// subfolder (for example usuario.github.io/datosonline/).
export function categoryUrl(slug) {
  return slug ? `./?${CATEGORY_PARAM}=${encodeURIComponent(slug)}` : "./";
}

// Splits the categories into the ones that fit in the menu and the rest.
// The active category is always kept visible.
export function splitCategories(categories, maxVisible, activeSlug = "") {
  const visible = categories.slice(0, maxVisible);
  const overflow = categories.slice(maxVisible);
  const activeIndex = overflow.findIndex((category) => category.slug === activeSlug);

  if (activeIndex !== -1 && visible.length > 0) {
    const [active] = overflow.splice(activeIndex, 1);
    overflow.unshift(visible.pop());
    visible.push(active);
  }

  return { visible, overflow };
}

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
