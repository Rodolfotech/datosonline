// Pure product logic: no DOM access, so it can be tested with node --test.

export const MAX_FEATURES = 6;
const BADGE_TONES = ["top", "hot", "new", "value"];
const DEFAULT_BADGE_TONE = "hot";

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
  };
}

// Returns the products ready to render, optionally filtered by category.
export function getVisibleProducts(products, categorySlug = "") {
  return products
    .filter(isValidProduct)
    .filter((product) => !categorySlug || product.category === categorySlug)
    .map(normalizeProduct);
}

export function productCountLabel(count) {
  return count === 1 ? "1 producto" : `${count} productos`;
}
