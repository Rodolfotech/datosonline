// Pure catalog logic used by the admin panel: adding, editing and removing
// products and creating categories. No DOM access and no network, so it can be
// tested with node --test. No function changes the lists it receives.
import { UNAVAILABLE_SLUG } from "./products.js";

const CODE_PREFIX = "A-";
const CODE_PATTERN = /^A-(\d+)$/;
const CODE_DIGITS = 2;
// Photos live in img/<folder>/<file>. Anything else is never deleted.
const IMAGE_PATH = /^img\/(?!.*\.\.)[^/]+(?:\/[^/]+)+$/;
const CHANGE_VERBS = { add: "agrega", update: "edita", remove: "elimina" };

// Internal code for a new product: one more than the highest existing one.
export function nextProductCode(products) {
  const numbers = products.map((product) => Number(CODE_PATTERN.exec(product.code ?? "")?.[1] ?? 0));
  const next = Math.max(0, ...numbers) + 1;
  return CODE_PREFIX + String(next).padStart(CODE_DIGITS, "0");
}

// "Línea Blanca & Hogar" -> "linea-blanca-hogar"
export function slugify(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// "No disponible" is calculated from the products; it cannot be created.
export function isReservedCategoryName(name) {
  return slugify(name) === UNAVAILABLE_SLUG;
}

// Finds the category with that name, ignoring capitals and accents, or adds a
// new one at the end. Returns the (possibly new) list and the category slug.
export function resolveCategory(categories, name) {
  const slug = slugify(name);
  if (!slug) throw new Error("La categoría necesita un nombre.");
  if (isReservedCategoryName(name)) throw new Error('"No disponible" no se puede usar como categoría.');

  const existing = categories.find((category) => category.slug === slug || slugify(category.name) === slug);
  if (existing) return { categories, slug: existing.slug };

  const cleanName = String(name).trim().replace(/\s+/g, " ");
  return { categories: [...categories, { slug, name: cleanName }], slug };
}

function findProductIndex(products, code) {
  const index = products.findIndex((product) => product.code === code);
  if (index === -1) throw new Error("El producto ya no existe en el catálogo.");
  return index;
}

// A new product goes first, so the site shows it first in its category.
export function addProduct(products, product) {
  if (products.some((item) => item.code === product.code)) throw new Error("Ya existe un producto con ese código.");
  return [product, ...products];
}

// Replaces the whole product, keeping its code and its position.
export function updateProduct(products, code, product) {
  const index = findProductIndex(products, code);
  return products.map((item, position) => (position === index ? { ...product, code } : item));
}

// Returns the list without the product and the photos that must be deleted.
export function removeProduct(products, code) {
  const index = findProductIndex(products, code);
  return {
    products: products.filter((item, position) => position !== index),
    removedImages: removedImagePaths(products[index], null),
  };
}

function imagePaths(product) {
  const images = Array.isArray(product?.images) ? product.images : [product?.image];
  return images.filter((image) => typeof image === "string" && IMAGE_PATH.test(image));
}

// Photos used by `before` that `after` no longer uses. Pass null as `after`
// when the product is being removed.
export function removedImagePaths(before, after) {
  const kept = new Set(imagePaths(after));
  return imagePaths(before).filter((image) => !kept.has(image));
}

// Removes a category that no product uses. Refuses otherwise, and says how
// many products use it, so the owner knows what to move or delete first.
export function removeCategory(categories, products, slug) {
  const used = products.filter((product) => product.category === slug).length;
  if (used > 0) throw new Error(`Esta categoría tiene ${used} ${used === 1 ? "producto" : "productos"}. Muévelos o elimínalos antes de borrarla.`);
  if (!categories.some((category) => category.slug === slug)) throw new Error("La categoría ya no existe.");
  return categories.filter((category) => category.slug !== slug);
}

// Changes the name shown for a category. The code (slug) does not change, so
// the products stay in it. A name must not be empty, reserved or already used.
export function renameCategory(categories, slug, newName) {
  const name = String(newName ?? "").trim().replace(/\s+/g, " ");
  if (!slugify(name)) throw new Error("La categoría necesita un nombre.");
  if (isReservedCategoryName(name)) throw new Error('"No disponible" no se puede usar como nombre de categoría.');
  const clash = categories.some((category) => category.slug !== slug && slugify(category.name) === slugify(name));
  if (clash) throw new Error("Ya existe una categoría con ese nombre.");
  if (!categories.some((category) => category.slug === slug)) throw new Error("La categoría ya no existe.");
  return categories.map((category) => (category.slug === slug ? { ...category, name } : category));
}

// Products listed under one tab of the panel. The tabs follow the site: "Todo"
// and each category show the available products; "No disponible" shows the
// unavailable ones.
export function productsInTab(products, slug) {
  if (slug === UNAVAILABLE_SLUG) return products.filter((product) => product.available === false);
  return products.filter((product) => product.available !== false && (slug === "" || product.category === slug));
}

// Message stored with every change made from the panel.
export function describeChange(action, product) {
  const verb = CHANGE_VERBS[action];
  if (!verb) throw new Error(`Acción desconocida: ${action}`);
  return `Panel: ${verb} "${product.title}"`;
}
