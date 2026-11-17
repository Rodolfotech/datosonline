import assert from "node:assert/strict";
import { test } from "node:test";
import { cardMatches, normalizeText, searchCards } from "../src/lib/search.js";

const iphone = { code: "A-000001", title: "iPhone 17 Pro Max", category: "smartphones", variants: [{ label: "512 GB", url: "https://meli.la/a" }] };
const bed = { code: "A-000004", title: "Colchón Emma Hybrid Premium 2 Plazas", category: "colchones", subcategory: "2 plazas", variants: [{ label: "", url: "https://meli.la/b" }] };
const names = { smartphones: "Smartphones", colchones: "Colchones" };
const categoryName = (slug) => names[slug] ?? "";
const titles = (cards) => cards.map((card) => card.title);

test("normalizeText drops accents, capitals and extra spaces", () => {
  assert.equal(normalizeText("  Colchón   EMMA "), "colchon emma");
  assert.equal(normalizeText(undefined), "");
});

test("a code finds its product, however it is written", () => {
  for (const query of ["A-000001", "a-000001", "a000001", "A 1", "A-1", "a1"]) {
    assert.equal(cardMatches(iphone, query, categoryName), true, query);
  }
  assert.equal(cardMatches(iphone, "A-000004", categoryName), false);
  assert.equal(cardMatches(iphone, "A-10", categoryName), false);
});

test("a name finds its product, with every word of the query", () => {
  assert.deepEqual(titles(searchCards([iphone, bed], "iphone", categoryName)), ["iPhone 17 Pro Max"]);
  assert.deepEqual(titles(searchCards([iphone, bed], "IPHONE 512", categoryName)), ["iPhone 17 Pro Max"]);
  assert.deepEqual(titles(searchCards([iphone, bed], "colchon emma", categoryName)), ["Colchón Emma Hybrid Premium 2 Plazas"]);
  assert.deepEqual(titles(searchCards([iphone, bed], "iphone 256", categoryName)), []);
});

test("the category and subcategory are searchable too", () => {
  assert.deepEqual(titles(searchCards([iphone, bed], "smartphones", categoryName)), ["iPhone 17 Pro Max"]);
  assert.deepEqual(titles(searchCards([iphone, bed], "2 plazas", categoryName)), ["Colchón Emma Hybrid Premium 2 Plazas"]);
});

test("an empty query shows everything, and nothing is changed", () => {
  const cards = [iphone, bed];
  assert.deepEqual(searchCards(cards, "   ", categoryName), cards);
  assert.equal(cards.length, 2);
});
