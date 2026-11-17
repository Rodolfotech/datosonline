// Pure product logic: no DOM access, so it can be tested with node --test.
//
// Product fields (src/data/products.js). Only `code`, `title`, `category` and
// a link are required; the rest is optional so older entries keep working.
//   url:       affiliate link to Mercado Libre (must start with https://).
//   variants:  used instead of `url` when each version has its own link:
//              [{ label: "512 GB", url }, ...]. The first one is preselected.
//   badge:     { label, tone } where tone is "top", "hot", "new", "value",
//              "gray", "black" or "silver".
//   images:    photos from the img/ folder, without a leading slash
//              ("img/do-001/a.webp"). The first one is the cover; with several
//              the card shows a gallery, and without any, a placeholder.
//   available: false marks the product as not available (default: true).
//   ribbon:    "horizontal" or "diagonal", position of the "No disponible" tape.

export const MAX_FEATURES = 6;
const BADGE_TONES = ["top", "hot", "new", "value", "gray", "black", "silver"];
const DEFAULT_BADGE_TONE = "hot";

// Slug of the category that gathers the products marked as not available.
// It is not stored in the data: the products keep their original category.
export const UNAVAILABLE_SLUG = "no-disponible";
const RIBBON_POSITIONS = ["horizontal", "diagonal"];
const DEFAULT_RIBBON_POSITION = "diagonal";

function isSafeUrl(url) {
  return typeof url === "string" && url.startsWith("https://");
}

// Accepts the new `variants` list (one affiliate link per version) and the
// older single `url` field. Always returns the links the visitor can open.
function getProductVariants(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const validVariants = variants
    .filter((variant) => variant?.label?.trim() && isSafeUrl(variant.url))
    .map((variant) => ({ label: variant.label.trim(), url: variant.url }));

  if (validVariants.length > 0) return validVariants;
  return isSafeUrl(product?.url) ? [{ label: "", url: product.url }] : [];
}

// A product can be shown only if the visitor can identify it and buy it.
export function isValidProduct(product) {
  return Boolean(product?.code && product?.title && product?.category) && getProductVariants(product).length > 0;
}

// Accepts the new `images` list and the older single `image` field.
function getProductImages(product) {
  const images = Array.isArray(product.images) ? product.images : [product.image];
  return images.filter((image) => typeof image === "string" && image.trim() !== "");
}

// Fills the optional fields so the card never has to deal with missing data.
export function normalizeProduct(product) {
  const badgeLabel = product.badge?.label?.trim() ?? "";
  const badgeTone = BADGE_TONES.includes(product.badge?.tone) ? product.badge.tone : DEFAULT_BADGE_TONE;

  return {
    code: product.code,
    title: product.title,
    category: product.category,
    subcategory: product.subcategory ?? "",
    features: (product.features ?? []).slice(0, MAX_FEATURES),
    badge: badgeLabel ? { label: badgeLabel, tone: badgeTone } : null,
    images: getProductImages(product),
    variants: getProductVariants(product),
    // Older entries have no `available` field: they are available.
    available: product.available !== false,
    ribbon: RIBBON_POSITIONS.includes(product.ribbon) ? product.ribbon : DEFAULT_RIBBON_POSITION,
  };
}

// Returns the products ready to render, optionally filtered by category.
// Unavailable products are shown only under UNAVAILABLE_SLUG: not in "all
// products" and not in their original category.
export function getVisibleProducts(products, categorySlug = "") {
  const visibleProducts = products.filter(isValidProduct).map(normalizeProduct);

  if (categorySlug === UNAVAILABLE_SLUG) return visibleProducts.filter((product) => !product.available);
  return visibleProducts
    .filter((product) => product.available)
    .filter((product) => !categorySlug || product.category === categorySlug);
}

// Identifier of a card, used in the link to it: "iPhone 17 Pro Max" + "512 GB"
// -> "iphone-17-pro-max-512-gb". Without accents, capitals or symbols.
export function cardId(title, label = "") {
  return `${title} ${label}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// One card per version: a product with several versions gives one card for
// each, each with its own link. Same filters as getVisibleProducts.
export function getCards(products, categorySlug = "") {
  return getVisibleProducts(products, categorySlug).flatMap((product) =>
    product.variants.map((variant) => ({
      ...product,
      variants: [variant],
      cardId: cardId(product.title, variant.label),
    })),
  );
}

export function productCountLabel(count) {
  return count === 1 ? "1 producto" : `${count} productos`;
}
