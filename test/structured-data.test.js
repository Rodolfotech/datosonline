import assert from "node:assert/strict";
import { test } from "node:test";
import { buildItemList } from "../src/lib/structured-data.js";

const BASE = "https://datosonline.cl";
const cards = [
  { cardId: "moto-g06-256-gb", title: "Moto G06", variants: [{ label: "256 GB", url: "https://meli.la/a" }], images: ["img/do-011/a.webp", "img/do-011/b.webp"] },
  { cardId: "colchon", title: "Colchón Emma", variants: [{ label: "", url: "https://meli.la/b" }], images: [] },
];

test("buildItemList describes each card as a list item with its link on the site", () => {
  const list = buildItemList(cards, BASE);
  assert.equal(list["@type"], "ItemList");
  assert.deepEqual(list.itemListElement.map((item) => item.position), [1, 2]);
  assert.equal(list.itemListElement[0].name, "Moto G06 • 256 GB");
  assert.equal(list.itemListElement[0].url, "https://datosonline.cl#moto-g06-256-gb");
  assert.equal(list.itemListElement[1].name, "Colchón Emma");
});

test("buildItemList uses the first photo as an absolute address, and skips it when there is none", () => {
  const list = buildItemList(cards, BASE);
  assert.equal(list.itemListElement[0].image, "https://datosonline.cl/img/do-011/a.webp");
  assert.equal("image" in list.itemListElement[1], false);
});

test("buildItemList does not state prices or availability it does not know", () => {
  const text = JSON.stringify(buildItemList(cards, BASE));
  assert.equal(/price|availability|offers/.test(text), false);
});

test("buildItemList works with no cards", () => {
  assert.deepEqual(buildItemList([], BASE).itemListElement, []);
});
