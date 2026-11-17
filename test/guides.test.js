import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { products } from "../src/data/products.js";
import { getCards } from "../src/lib/products.js";

const cardIds = new Set(getCards(products).map((card) => card.cardId));
const guideFiles = readdirSync("guias").filter((name) => name.endsWith(".html") && name !== "index.html");

test("every guide has a title, a description and a canonical address", () => {
  assert.equal(guideFiles.length, 10);
  for (const file of guideFiles) {
    const page = readFileSync(`guias/${file}`, "utf8");
    assert.match(page, /<title>[^<]{10,70}<\/title>/, file);
    assert.match(page, /<meta name="description" content="[^"]{40,160}"/, file);
    assert.match(page, /rel="canonical" href="https:\/\/datosonline\.cl\/guias\//, file);
  }
});

test("every product card named in a guide exists in the catalog", () => {
  for (const file of guideFiles) {
    const page = readFileSync(`guias/${file}`, "utf8");
    const names = [...page.matchAll(/data-guide-cards="([^"]*)"/g)].flatMap((match) => match[1].split(" "));
    assert.ok(names.length > 0, file);
    for (const name of names) assert.ok(cardIds.has(name), `${file}: ${name}`);
  }
});

test("every guide shows its author and publication date", () => {
  for (const file of guideFiles) {
    const page = readFileSync(`guias/${file}`, "utf8");
    assert.match(page, /class="article__byline">Por [^<]+ · Publicado el \d{1,2} de [a-záéíóú]+ de \d{4}</, file);
    assert.match(page, /article:published_time" content="\d{4}-\d{2}-\d{2}T/, file);
  }
});

test("the sitemap lists the home page and every guide, and never the panel", () => {
  const sitemap = readFileSync("sitemap.xml", "utf8");
  assert.match(sitemap, /<loc>https:\/\/datosonline\.cl\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/datosonline\.cl\/guias\/<\/loc>/);
  for (const file of guideFiles) {
    assert.ok(sitemap.includes(`<loc>https://datosonline.cl/guias/${file}</loc>`), file);
  }
  assert.equal(sitemap.includes("gestion"), false);
});

test("robots.txt allows the site and points to the sitemap, and does not name the panel", () => {
  const robots = readFileSync("robots.txt", "utf8");
  assert.match(robots, /Sitemap: https:\/\/datosonline\.cl\/sitemap\.xml/);
  assert.equal(robots.includes("gestion"), false);
});
