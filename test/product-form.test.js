import assert from "node:assert/strict";
import { test } from "node:test";
import { products } from "../src/data/products.js";
import {
  MAX_IMAGES,
  MAX_PHOTO_SIDE,
  NEW_CATEGORY,
  assignPhotoPaths,
  canAddFeature,
  canAddImage,
  emptyProductForm,
  formToProduct,
  isAffiliateLink,
  isNewPhoto,
  newPhotoKey,
  photoPath,
  productToForm,
  scaledSize,
  validateProductForm,
} from "../src/lib/product-form.js";

const valid = {
  ...emptyProductForm(),
  title: "Colchón Emma",
  category: "colchones",
  variants: [{ label: "", url: "https://meli.la/2VxPqC7" }],
};
const fields = (values) => validateProductForm(values).map((error) => error.field);

test("isAffiliateLink accepts only the short links Mercado Libre gives", () => {
  for (const url of ["https://meli.la/2QGS1m7", "https://meli.la/1b1hRfv", "  https://meli.la/2m39efj  "]) {
    assert.equal(isAffiliateLink(url), true, url);
  }
  for (const url of [
    "http://meli.la/2QGS1m7",
    "https://meli.la/",
    "https://meli.la",
    "meli.la/2QGS1m7",
    "https://www.mercadolibre.cl/p/MLC123",
    "https://meli.la.evil.com/2QGS1m7",
    "https://evil.com/https://meli.la/2QGS1m7",
    "https://meli.la/2QGS1m7?x=<script>",
    "https://meli.la/a b",
    "https://user@meli.la/2QGS1m7",
    "javascript:alert(1)",
    "",
    undefined,
  ]) {
    assert.equal(isAffiliateLink(url), false, String(url));
  }
});

test("a complete form has no errors", () => {
  assert.deepEqual(validateProductForm(valid), []);
});

test("title, category and link are required", () => {
  assert.deepEqual(fields({ ...valid, title: "   " }), ["title"]);
  assert.deepEqual(fields({ ...valid, category: "" }), ["category"]);
  assert.deepEqual(fields({ ...valid, variants: [{ label: "", url: "" }] }), ["variants.0.url"]);
  assert.deepEqual(fields({ ...valid, variants: [] }), ["variants"]);
});

test("every error has a message in Spanish for its field", () => {
  const errors = validateProductForm({ ...valid, title: "", category: "", variants: [] });
  assert.equal(errors.length, 3);
  for (const error of errors) assert.ok(error.message.length > 10, error.field);
});

test("a link that is not from meli.la is rejected", () => {
  assert.deepEqual(fields({ ...valid, variants: [{ label: "", url: "https://www.mercadolibre.cl/x" }] }), ["variants.0.url"]);
});

test("with several versions each one needs a name and a link", () => {
  const variants = [
    { label: "512 GB", url: "https://meli.la/1b1hRfv" },
    { label: "", url: "https://meli.la/2gZiBfY" },
    { label: "128 GB", url: "" },
  ];
  assert.deepEqual(fields({ ...valid, variants }), ["variants.1.label", "variants.2.url"]);
  assert.deepEqual(fields({ ...valid, variants: variants.slice(0, 1) }), []);
});

test("a new category needs a name that is not reserved", () => {
  assert.deepEqual(fields({ ...valid, category: NEW_CATEGORY, newCategory: "Línea Blanca" }), []);
  assert.deepEqual(fields({ ...valid, category: NEW_CATEGORY, newCategory: "  " }), ["newCategory"]);
  assert.deepEqual(fields({ ...valid, category: NEW_CATEGORY, newCategory: "¿?" }), ["newCategory"]);
  assert.deepEqual(fields({ ...valid, category: NEW_CATEGORY, newCategory: "NO DISPONIBLE" }), ["newCategory"]);
  assert.deepEqual(fields({ ...valid, category: "no-disponible" }), ["category"]);
});

test("at most six features and ten photos", () => {
  const features = ["a", "b", "c", "d", "e", "f", "g"];
  assert.deepEqual(fields({ ...valid, features }), ["features"]);
  assert.deepEqual(fields({ ...valid, features: [...features.slice(0, 6), "  ", ""] }), []);
  const images = Array.from({ length: 11 }, (_, index) => `img/do-001/${index}.webp`);
  assert.deepEqual(fields({ ...valid, images }), ["images"]);
  assert.deepEqual(fields({ ...valid, images: images.slice(0, 10) }), []);
  assert.equal(MAX_IMAGES, 10);
  assert.equal(canAddImage(9), true);
  assert.equal(canAddImage(10), false);
  assert.equal(canAddFeature(5), true);
  assert.equal(canAddFeature(6), false);
});

test("a product without photos is valid", () => {
  assert.deepEqual(fields({ ...valid, images: [] }), []);
});

test("an unavailable product needs a ribbon position", () => {
  assert.deepEqual(fields({ ...valid, available: false, ribbon: "horizontal" }), []);
  assert.deepEqual(fields({ ...valid, available: false, ribbon: "diagonal" }), []);
  assert.deepEqual(fields({ ...valid, available: false, ribbon: "" }), ["ribbon"]);
  assert.deepEqual(fields({ ...valid, available: true, ribbon: "" }), []);
});

test("formToProduct writes only the fields that have a value", () => {
  assert.deepEqual(formToProduct({ ...valid, title: "  Colchón Emma  " }, { code: "DO-008", category: "colchones" }), {
    code: "DO-008",
    title: "Colchón Emma",
    category: "colchones",
    url: "https://meli.la/2VxPqC7",
  });
});

test("formToProduct keeps every filled field, cleaned up", () => {
  const product = formToProduct(
    {
      ...valid,
      subcategory: " 2 plazas ",
      features: [" 5 capas ", "", "Funda lavable"],
      badgeLabel: " Recomendado ",
      badgeTone: "top",
      images: ["img/do-008/a.webp"],
      variants: [
        { label: " 512 GB ", url: " https://meli.la/1b1hRfv " },
        { label: "256 GB", url: "https://meli.la/2gZiBfY" },
      ],
      available: false,
      ribbon: "horizontal",
    },
    { code: "DO-008", category: "colchones" },
  );
  assert.deepEqual(product, {
    code: "DO-008",
    title: "Colchón Emma",
    category: "colchones",
    subcategory: "2 plazas",
    features: ["5 capas", "Funda lavable"],
    badge: { label: "Recomendado", tone: "top" },
    images: ["img/do-008/a.webp"],
    variants: [
      { label: "512 GB", url: "https://meli.la/1b1hRfv" },
      { label: "256 GB", url: "https://meli.la/2gZiBfY" },
    ],
    available: false,
    ribbon: "horizontal",
  });
});

test("a single named version stays as a version so the card shows its selector", () => {
  const product = formToProduct({ ...valid, variants: [{ label: "256 GB", url: "https://meli.la/2m39efj" }] }, { code: "DO-004", category: "smartphones" });
  assert.deepEqual(product.variants, [{ label: "256 GB", url: "https://meli.la/2m39efj" }]);
  assert.equal("url" in product, false);
});

test("an available product stores neither the availability nor the ribbon", () => {
  const product = formToProduct({ ...valid, available: true, ribbon: "horizontal" }, { code: "DO-008", category: "colchones" });
  assert.equal("available" in product, false);
  assert.equal("ribbon" in product, false);
});

test("productToForm loads old products: single url, single image, no optional fields", () => {
  const form = productToForm({ code: "DO-050", title: "Old", category: "colchones", url: "https://meli.la/abc", image: "img/do-050/a.webp" });
  assert.deepEqual(form, {
    ...emptyProductForm(),
    title: "Old",
    category: "colchones",
    variants: [{ label: "", url: "https://meli.la/abc" }],
    images: ["img/do-050/a.webp"],
  });
  assert.deepEqual(validateProductForm(form), []);
});

test("productToForm loads the availability and the ribbon", () => {
  const form = productToForm({ ...products[0], available: false, ribbon: "horizontal" });
  assert.equal(form.available, false);
  assert.equal(form.ribbon, "horizontal");
});

test("the published products survive loading and saving without changes", () => {
  for (const product of products) {
    const form = productToForm(product);
    assert.deepEqual(validateProductForm(form), [], product.title);
    assert.deepEqual(formToProduct(form, { code: product.code, category: product.category }), product, product.title);
  }
});

test("the form functions do not change the data they receive", () => {
  const original = structuredClone(products[0]);
  const form = productToForm(products[0]);
  form.variants[0].url = "changed";
  form.features.push("changed");
  form.images.push("changed");
  assert.deepEqual(products[0], original);
});

test("scaledSize keeps the longest side within 800 px without enlarging", () => {
  assert.equal(MAX_PHOTO_SIDE, 800);
  assert.deepEqual(scaledSize(4000, 3000), { width: 800, height: 600 });
  assert.deepEqual(scaledSize(3000, 4000), { width: 600, height: 800 });
  assert.deepEqual(scaledSize(800, 800), { width: 800, height: 800 });
  assert.deepEqual(scaledSize(500, 400), { width: 500, height: 400 });
  assert.deepEqual(scaledSize(8000, 5), { width: 800, height: 1 });
  assert.deepEqual(scaledSize(1001, 333), { width: 800, height: 266 });
});

test("photoPath builds a short path inside the product folder", () => {
  assert.equal(photoPath("DO-008", 1, "abc123", "webp"), "img/do-008/1-abc123.webp");
  assert.equal(photoPath("DO-120", 10, "x9", "jpg"), "img/do-120/10-x9.jpg");
});

test("new photos are told apart from the ones already published", () => {
  const key = newPhotoKey("abc");
  assert.equal(isNewPhoto(key), true);
  assert.equal(isNewPhoto("img/do-001/a.webp"), false);
  assert.equal(isNewPhoto(undefined), false);
});

test("assignPhotoPaths gives every new photo its final path and keeps the order", () => {
  const first = newPhotoKey("one");
  const second = newPhotoKey("two");
  const photos = { [first]: { base64: "AAAA", extension: "webp" }, [second]: { base64: "BBBB", extension: "jpg" } };
  const suffixes = ["s1", "s2"];
  const result = assignPhotoPaths([second, "img/do-008/old.webp", first], "DO-008", photos, () => suffixes.shift());
  assert.deepEqual(result, {
    images: ["img/do-008/1-s1.jpg", "img/do-008/old.webp", "img/do-008/3-s2.webp"],
    newImages: [
      { path: "img/do-008/1-s1.jpg", base64: "BBBB" },
      { path: "img/do-008/3-s2.webp", base64: "AAAA" },
    ],
  });
});

test("assignPhotoPaths leaves a product without new photos untouched", () => {
  const images = ["img/do-001/a.webp", "img/do-001/b.webp"];
  assert.deepEqual(assignPhotoPaths(images, "DO-001", {}, () => "x"), { images, newImages: [] });
  assert.deepEqual(assignPhotoPaths([], "DO-001", {}, () => "x"), { images: [], newImages: [] });
});

test("the form counts new photos towards the limit of ten", () => {
  const images = Array.from({ length: 11 }, (_, index) => (index < 5 ? `img/do-001/${index}.webp` : newPhotoKey(String(index))));
  assert.deepEqual(fields({ ...valid, images }), ["images"]);
  assert.deepEqual(fields({ ...valid, images: images.slice(0, 10) }), []);
});
