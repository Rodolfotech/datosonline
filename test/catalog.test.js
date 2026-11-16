import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addProduct,
  describeChange,
  isReservedCategoryName,
  nextProductCode,
  removeProduct,
  removedImagePaths,
  resolveCategory,
  slugify,
  updateProduct,
} from "../src/lib/catalog.js";

const phone = { code: "DO-001", title: "Phone", category: "smartphones", url: "https://meli.la/a", images: ["img/do-001/a.webp", "img/do-001/b.webp"] };
const bed = { code: "DO-007", title: "Bed", category: "colchones", url: "https://meli.la/b", images: ["img/do-007/a.webp"] };
const products = [phone, bed];
const categories = [
  { slug: "smartphones", name: "Smartphones" },
  { slug: "colchones", name: "Colchones" },
  { slug: "pc-gamer", name: "PC Gamer" },
];
const codes = (list) => list.map((product) => product.code);
const frozen = (value) => {
  if (value && typeof value === "object") Object.values(value).forEach(frozen);
  return Object.freeze(value);
};

test("nextProductCode continues after the highest existing code", () => {
  assert.equal(nextProductCode(products), "DO-008");
  assert.equal(nextProductCode([]), "DO-001");
  assert.equal(nextProductCode([{ code: "DO-099" }]), "DO-100");
  assert.equal(nextProductCode([{ code: "DO-999" }]), "DO-1000");
});

test("nextProductCode ignores codes with another shape", () => {
  assert.equal(nextProductCode([{ code: "X-500" }, { code: "DO-002" }, { code: undefined }, { code: "DO-abc" }]), "DO-003");
});

test("slugify removes accents, capitals and symbols", () => {
  assert.equal(slugify("Smartphones"), "smartphones");
  assert.equal(slugify("  PC  Gamer "), "pc-gamer");
  assert.equal(slugify("Línea Blanca & Hogar"), "linea-blanca-hogar");
  assert.equal(slugify("Niños/Bebés"), "ninos-bebes");
  assert.equal(slugify("¡¿?!"), "");
});

test("isReservedCategoryName detects every spelling of the unavailable category", () => {
  for (const name of ["No disponible", "NO DISPONIBLE", "no  disponible ", "No-Disponible", "nó disponible"]) {
    assert.equal(isReservedCategoryName(name), true, name);
  }
  assert.equal(isReservedCategoryName("Disponible"), false);
  assert.equal(isReservedCategoryName("Colchones"), false);
});

test("resolveCategory reuses an existing category ignoring capitals and accents", () => {
  for (const name of ["Colchones", "colchones", " COLCHÓNES ", "pc gamer", "PC-Gamer"]) {
    const result = resolveCategory(categories, name);
    assert.equal(result.categories, categories, name);
    assert.ok(["colchones", "pc-gamer"].includes(result.slug), name);
  }
});

test("resolveCategory adds a new category at the end with a trimmed name", () => {
  const result = resolveCategory(categories, "  Línea   Blanca ");
  assert.equal(result.slug, "linea-blanca");
  assert.deepEqual(result.categories.at(-1), { slug: "linea-blanca", name: "Línea Blanca" });
  assert.equal(result.categories.length, 4);
  assert.equal(categories.length, 3);
});

test("resolveCategory rejects reserved and empty names", () => {
  assert.throws(() => resolveCategory(categories, "No disponible"));
  assert.throws(() => resolveCategory(categories, "   "));
  assert.throws(() => resolveCategory(categories, "¡¿?!"));
});

test("addProduct puts the new product first", () => {
  const tv = { code: "DO-008", title: "TV", category: "smartphones", url: "https://meli.la/c" };
  assert.deepEqual(codes(addProduct(products, tv)), ["DO-008", "DO-001", "DO-007"]);
});

test("addProduct rejects a code that already exists", () => {
  assert.throws(() => addProduct(products, { ...bed, title: "Other" }));
});

test("updateProduct keeps the code and the position", () => {
  const updated = updateProduct(products, "DO-007", { code: "DO-999", title: "Bed 2", category: "colchones", url: "https://meli.la/z" });
  assert.deepEqual(codes(updated), ["DO-001", "DO-007"]);
  assert.equal(updated[1].title, "Bed 2");
  assert.equal(updated[1].images, undefined);
  assert.equal(updated[0], phone);
});

test("updateProduct fails when the product no longer exists", () => {
  assert.throws(() => updateProduct(products, "DO-404", bed));
});

test("removeProduct returns the remaining products and the photos to delete", () => {
  const result = removeProduct(products, "DO-001");
  assert.deepEqual(codes(result.products), ["DO-007"]);
  assert.deepEqual(result.removedImages, ["img/do-001/a.webp", "img/do-001/b.webp"]);
  assert.throws(() => removeProduct(products, "DO-404"));
});

test("removing the last product of a category keeps the categories untouched", () => {
  const result = removeProduct(products, "DO-007");
  assert.deepEqual(codes(result.products), ["DO-001"]);
  assert.equal("categories" in result, false);
});

test("removedImagePaths lists the photos that are no longer used", () => {
  const edited = { ...phone, images: ["img/do-001/b.webp", "img/do-001/c.webp"] };
  assert.deepEqual(removedImagePaths(phone, edited), ["img/do-001/a.webp"]);
  assert.deepEqual(removedImagePaths(phone, phone), []);
  assert.deepEqual(removedImagePaths(phone, { ...phone, images: [] }), ["img/do-001/a.webp", "img/do-001/b.webp"]);
  assert.deepEqual(removedImagePaths(phone, null), ["img/do-001/a.webp", "img/do-001/b.webp"]);
});

test("removedImagePaths accepts the older single image field", () => {
  assert.deepEqual(removedImagePaths({ ...bed, images: undefined, image: "img/do-007/old.webp" }, null), ["img/do-007/old.webp"]);
});

test("removedImagePaths never returns files outside the img folder", () => {
  const risky = { ...phone, images: ["img/do-001/a.webp", "src/main.js", "/img/x.webp", "img/../index.html", "https://example.com/a.webp", "img/do-001/", 42] };
  assert.deepEqual(removedImagePaths(risky, null), ["img/do-001/a.webp"]);
});

test("describeChange writes a readable message for the change history", () => {
  assert.equal(describeChange("add", phone), 'Panel: agrega "Phone"');
  assert.equal(describeChange("update", phone), 'Panel: edita "Phone"');
  assert.equal(describeChange("remove", phone), 'Panel: elimina "Phone"');
  assert.throws(() => describeChange("zzz", phone));
});

test("no catalog function changes the data it receives", () => {
  const list = frozen(structuredClone(products));
  const cats = frozen(structuredClone(categories));
  addProduct(list, { code: "DO-008", title: "TV", category: "smartphones", url: "https://meli.la/c" });
  updateProduct(list, "DO-001", { title: "X", category: "smartphones", url: "https://meli.la/c" });
  removeProduct(list, "DO-001");
  resolveCategory(cats, "Nueva");
  resolveCategory(cats, "Colchones");
  nextProductCode(list);
  assert.deepEqual(list, products);
  assert.deepEqual(cats, categories);
});
