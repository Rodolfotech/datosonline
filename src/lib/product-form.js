// Pure logic of the product form in the admin panel: default values,
// validation and the conversion between what the owner types and the product
// stored in src/data/products.js. No DOM access: tested with node --test.
//
// Form values:
//   title, subcategory, badgeLabel, badgeTone: text
//   category:    slug of an existing category, or NEW_CATEGORY
//   newCategory: name of the category to create (only with NEW_CATEGORY)
//   features:    list of texts
//   variants:    [{ label, url }]; with a single one the label is optional
//   images:      photo paths ("img/do-008/a.webp"), the cover first. A photo
//                chosen in the panel and not published yet is a temporary
//                key (see newPhotoKey) until assignPhotoPaths names it.
//   available:   false when the product is not available
//   ribbon:      "horizontal" or "diagonal" (only when not available)
import { isReservedCategoryName, slugify } from "./catalog.js";
import { MAX_FEATURES, UNAVAILABLE_SLUG } from "./products.js";

export const MAX_IMAGES = 10;
// Longest side, in pixels, of a photo stored on the site.
export const MAX_PHOTO_SIDE = 800;
const NEW_PHOTO_PREFIX = "new:";
export const NEW_CATEGORY = "__new__";
export const RIBBON_POSITIONS = ["horizontal", "diagonal"];
const DEFAULT_RIBBON_POSITION = "diagonal";
const DEFAULT_BADGE_TONE = "hot";

// Short affiliate link given by Mercado Libre: https://meli.la/<code>.
const AFFILIATE_LINK = /^https:\/\/meli\.la\/[A-Za-z0-9_-]+$/;

const clean = (text) => String(text ?? "").trim();
const cleanList = (list) => (list ?? []).map(clean).filter(Boolean);

export function isAffiliateLink(url) {
  return AFFILIATE_LINK.test(clean(url));
}

export function canAddImage(count) {
  return count < MAX_IMAGES;
}

export function canAddFeature(count) {
  return count < MAX_FEATURES;
}

// Size of a photo reduced so its longest side fits in MAX_PHOTO_SIDE. Small
// photos are not enlarged.
export function scaledSize(width, height) {
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function newPhotoKey(id) {
  return NEW_PHOTO_PREFIX + id;
}

export function isNewPhoto(image) {
  return typeof image === "string" && image.startsWith(NEW_PHOTO_PREFIX);
}

// "img/do-008/1-abc123.webp". The random suffix keeps two photos from sharing
// a name and a replaced photo from being served from the browser cache.
export function photoPath(code, position, suffix, extension) {
  return `img/${code.toLowerCase()}/${position}-${suffix}.${extension}`;
}

// Replaces the temporary keys of the new photos with their final paths.
// `photos` maps each key to { base64, extension }. Returns the photo list for
// the product and the files to upload.
export function assignPhotoPaths(images, code, photos, makeSuffix) {
  const newImages = [];
  const paths = images.map((image, index) => {
    if (!isNewPhoto(image)) return image;
    const { base64, extension } = photos[image];
    const path = photoPath(code, index + 1, makeSuffix(), extension);
    newImages.push({ path, base64 });
    return path;
  });
  return { images: paths, newImages };
}

export function emptyProductForm() {
  return {
    title: "",
    category: "",
    newCategory: "",
    subcategory: "",
    features: [],
    badgeLabel: "",
    badgeTone: DEFAULT_BADGE_TONE,
    variants: [{ label: "", url: "" }],
    images: [],
    available: true,
    ribbon: DEFAULT_RIBBON_POSITION,
  };
}

function validateCategory(values) {
  if (values.category === NEW_CATEGORY) {
    if (!slugify(values.newCategory)) return [{ field: "newCategory", message: "Escribe el nombre de la categoría nueva." }];
    if (isReservedCategoryName(values.newCategory)) {
      return [{ field: "newCategory", message: '"No disponible" no se puede usar como nombre de categoría.' }];
    }
    return [];
  }
  if (!clean(values.category) || values.category === UNAVAILABLE_SLUG) {
    return [{ field: "category", message: "Elige una categoría para el producto." }];
  }
  return [];
}

function validateVariants(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return [{ field: "variants", message: "Agrega el enlace de Mercado Libre del producto." }];
  }
  const errors = [];
  variants.forEach((variant, index) => {
    // With several versions the visitor has to tell them apart.
    if (variants.length > 1 && !clean(variant.label)) {
      errors.push({ field: `variants.${index}.label`, message: 'Escribe el nombre de esta versión, por ejemplo "256 GB".' });
    }
    if (!isAffiliateLink(variant.url)) {
      errors.push({ field: `variants.${index}.url`, message: "Pega el enlace que entrega Mercado Libre; debe comenzar con https://meli.la/" });
    }
  });
  return errors;
}

// Returns the problems found as [{ field, message }]; empty when the form can
// be published.
export function validateProductForm(values) {
  const errors = [];
  if (!clean(values.title)) errors.push({ field: "title", message: "Escribe el título del producto." });
  errors.push(...validateCategory(values));
  if (cleanList(values.features).length > MAX_FEATURES) {
    errors.push({ field: "features", message: `Deja como máximo ${MAX_FEATURES} características.` });
  }
  if ((values.images ?? []).length > MAX_IMAGES) {
    errors.push({ field: "images", message: `Deja como máximo ${MAX_IMAGES} fotos.` });
  }
  errors.push(...validateVariants(values.variants));
  if (values.available === false && !RIBBON_POSITIONS.includes(values.ribbon)) {
    errors.push({ field: "ribbon", message: "Elige dónde va la cinta: a media foto o en diagonal." });
  }
  return errors;
}

// Builds the product to store from a valid form. `code` is the internal code
// and `category` the slug already resolved (existing or just created).
// Empty optional fields are left out, like in the entries written by hand.
export function formToProduct(values, { code, category }) {
  const product = { code, title: clean(values.title), category };

  const subcategory = clean(values.subcategory);
  if (subcategory) product.subcategory = subcategory;

  const features = cleanList(values.features);
  if (features.length > 0) product.features = features;

  const badgeLabel = clean(values.badgeLabel);
  if (badgeLabel) product.badge = { label: badgeLabel, tone: values.badgeTone };

  const images = cleanList(values.images);
  if (images.length > 0) product.images = images;

  const variants = values.variants.map((variant) => ({ label: clean(variant.label), url: clean(variant.url) }));
  // A single link without a version name is stored as plain `url`.
  if (variants.length === 1 && !variants[0].label) product.url = variants[0].url;
  else product.variants = variants;

  if (values.available === false) {
    product.available = false;
    product.ribbon = values.ribbon;
  }
  return product;
}

// Loads a stored product into the form, including the older `url` and `image`
// fields.
export function productToForm(product) {
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const variants = hasVariants
    ? product.variants.map((variant) => ({ label: variant.label ?? "", url: variant.url ?? "" }))
    : [{ label: "", url: product.url ?? "" }];
  const images = Array.isArray(product.images) ? product.images : [product.image];

  return {
    ...emptyProductForm(),
    title: product.title ?? "",
    category: product.category ?? "",
    subcategory: product.subcategory ?? "",
    features: [...(product.features ?? [])],
    badgeLabel: product.badge?.label ?? "",
    badgeTone: product.badge?.tone ?? DEFAULT_BADGE_TONE,
    variants,
    images: cleanList(images),
    available: product.available !== false,
    ribbon: RIBBON_POSITIONS.includes(product.ribbon) ? product.ribbon : DEFAULT_RIBBON_POSITION,
  };
}
