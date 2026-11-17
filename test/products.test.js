import assert from "node:assert/strict";
import { test } from "node:test";
import { UNAVAILABLE_SLUG, cardId, getCards, getVisibleProducts, isValidProduct, normalizeProduct, productCountLabel } from "../src/lib/products.js";

const base = { code: "DO-001", title: "Phone", category: "tecnologia", url: "https://example.com/p" };

test("isValidProduct requires code, title, category and an https url", () => {
  assert.equal(isValidProduct(base), true);
  assert.equal(isValidProduct({ ...base, title: "" }), false);
  assert.equal(isValidProduct({ ...base, url: "javascript:alert(1)" }), false);
  assert.equal(isValidProduct({ ...base, url: undefined }), false);
  assert.equal(isValidProduct(null), false);
});

test("normalizeProduct fills the optional fields of old entries", () => {
  const product = normalizeProduct(base);
  assert.equal(product.subcategory, "");
  assert.deepEqual(product.features, []);
  assert.equal(product.badge, null);
  assert.deepEqual(product.images, []);
});

test("normalizeProduct accepts a photo list and the older single image field", () => {
  assert.deepEqual(normalizeProduct({ ...base, images: ["/a.webp", "", "/b.webp"] }).images, ["/a.webp", "/b.webp"]);
  assert.deepEqual(normalizeProduct({ ...base, image: "/old.webp" }).images, ["/old.webp"]);
});

test("normalizeProduct turns the older single url into one variant", () => {
  assert.deepEqual(normalizeProduct(base).variants, [{ label: "", url: "https://example.com/p" }]);
});

test("variants give one link per version and unsafe ones are dropped", () => {
  const product = {
    ...base,
    url: undefined,
    variants: [
      { label: "512 GB", url: "https://example.com/512" },
      { label: "256 GB", url: "http://example.com/256" },
      { label: "", url: "https://example.com/unnamed" },
    ],
  };
  assert.equal(isValidProduct(product), true);
  assert.deepEqual(normalizeProduct(product).variants, [{ label: "512 GB", url: "https://example.com/512" }]);
  assert.equal(isValidProduct({ ...base, url: undefined, variants: [] }), false);
});

test("normalizeProduct keeps at most six features", () => {
  const product = normalizeProduct({ ...base, features: ["a", "b", "c", "d", "e", "f", "g"] });
  assert.deepEqual(product.features, ["a", "b", "c", "d", "e", "f"]);
});

test("normalizeProduct accepts gray, black and silver badges", () => {
  for (const tone of ["gray", "black", "silver"]) {
    assert.deepEqual(normalizeProduct({ ...base, badge: { label: "X", tone } }).badge, { label: "X", tone });
  }
});

test("normalizeProduct falls back to the default tone for unknown badge tones", () => {
  assert.deepEqual(normalizeProduct({ ...base, badge: { label: "Oferta", tone: "zzz" } }).badge, { label: "Oferta", tone: "hot" });
  assert.equal(normalizeProduct({ ...base, badge: { label: "  ", tone: "top" } }).badge, null);
});

test("getVisibleProducts filters by category and drops invalid products", () => {
  const list = [base, { ...base, code: "DO-002", category: "colchones" }, { ...base, code: "DO-003", url: "" }];
  assert.deepEqual(getVisibleProducts(list).map((product) => product.code), ["DO-001", "DO-002"]);
  assert.deepEqual(getVisibleProducts(list, "colchones").map((product) => product.code), ["DO-002"]);
  assert.deepEqual(getVisibleProducts(list, "hogar"), []);
});

test("productCountLabel handles singular and plural", () => {
  assert.equal(productCountLabel(1), "1 producto");
  assert.equal(productCountLabel(0), "0 productos");
  assert.equal(productCountLabel(10), "10 productos");
});

test("normalizeProduct treats products without `available` as available", () => {
  assert.equal(normalizeProduct(base).available, true);
  assert.equal(normalizeProduct({ ...base, available: true }).available, true);
  assert.equal(normalizeProduct({ ...base, available: false }).available, false);
});

test("normalizeProduct accepts the two ribbon positions and falls back to diagonal", () => {
  assert.equal(normalizeProduct({ ...base, available: false, ribbon: "horizontal" }).ribbon, "horizontal");
  assert.equal(normalizeProduct({ ...base, available: false, ribbon: "diagonal" }).ribbon, "diagonal");
  assert.equal(normalizeProduct({ ...base, available: false, ribbon: "zzz" }).ribbon, "diagonal");
  assert.equal(normalizeProduct({ ...base, available: false }).ribbon, "diagonal");
});

test("unavailable products are shown only in the unavailable category", () => {
  const list = [
    base,
    { ...base, code: "DO-002", available: false },
    { ...base, code: "DO-003", category: "colchones", available: false, ribbon: "horizontal" },
  ];
  assert.equal(UNAVAILABLE_SLUG, "no-disponible");
  assert.deepEqual(getVisibleProducts(list).map((product) => product.code), ["DO-001"]);
  assert.deepEqual(getVisibleProducts(list, "tecnologia").map((product) => product.code), ["DO-001"]);
  assert.deepEqual(getVisibleProducts(list, "colchones"), []);
  assert.deepEqual(getVisibleProducts(list, UNAVAILABLE_SLUG).map((product) => product.code), ["DO-002", "DO-003"]);
});

test("an unavailable product keeps its original category and data", () => {
  const [product] = getVisibleProducts([{ ...base, available: false, features: ["a"] }], UNAVAILABLE_SLUG);
  assert.equal(product.category, "tecnologia");
  assert.deepEqual(product.features, ["a"]);
  assert.deepEqual(product.variants, [{ label: "", url: "https://example.com/p" }]);
});

test("cardId is the title and version in lowercase, without accents or symbols", () => {
  assert.equal(cardId("iPhone 17 Pro Max", "512 GB"), "iphone-17-pro-max-512-gb");
  assert.equal(cardId("Colchón Emma Hybrid Premium 2 Plazas", ""), "colchon-emma-hybrid-premium-2-plazas");
  assert.equal(cardId("¿Qué? 55\" TV", "65\""), "que-55-tv-65");
});

test("getCards makes one card per version, with its own link", () => {
  const list = [
    { ...base, code: "DO-001", title: "iPhone", variants: [
      { label: "512 GB", url: "https://meli.la/a" },
      { label: "256 GB", url: "https://meli.la/b" },
    ] },
    { ...base, code: "DO-002", title: "Colchón", category: "colchones" },
  ];
  const cards = getCards(list);
  assert.deepEqual(cards.map((card) => card.cardId), ["iphone-512-gb", "iphone-256-gb", "colchon"]);
  assert.deepEqual(cards[1].variants, [{ label: "256 GB", url: "https://meli.la/b" }]);
  assert.equal(cards[2].variants[0].url, "https://example.com/p");
});

test("getCards keeps the same filters as getVisibleProducts", () => {
  const list = [base, { ...base, code: "DO-002", available: false }];
  assert.deepEqual(getCards(list).map((card) => card.code), ["DO-001"]);
  assert.deepEqual(getCards(list, UNAVAILABLE_SLUG).map((card) => card.code), ["DO-002"]);
});
