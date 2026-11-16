import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { categories } from "../src/data/categories.js";
import { products } from "../src/data/products.js";
import { parseDataFile, serializeDataFile } from "../src/lib/data-file.js";

const sample = [
  { code: "DO-001", title: 'Pantalla 6,9" <b> & más', category: "smartphones", variants: [{ label: "256 GB", url: "https://meli.la/abc" }] },
  { code: "DO-002", title: "Colchón [2 plazas]; export const x = 1", category: "colchones", url: "https://meli.la/def", available: false },
];

test("a data file survives a round trip", () => {
  assert.deepEqual(parseDataFile(serializeDataFile("products", sample)), sample);
  assert.deepEqual(parseDataFile(serializeDataFile("categories", [])), []);
});

test("serializeDataFile writes a JavaScript module the site can import", () => {
  const text = serializeDataFile("products", sample);
  assert.match(text, /^\/\/ /);
  assert.match(text, /\nexport const products = \[\n/);
  assert.ok(text.endsWith("];\n"));
});

test("serializeDataFile only accepts simple export names", () => {
  assert.throws(() => serializeDataFile("products = 1; alert(1); const x", sample));
  assert.throws(() => serializeDataFile("", sample));
});

test("parseDataFile rejects files that are not in the generated format", () => {
  assert.throws(() => parseDataFile("export const products = [{ code: 'DO-001' }];"), /formato/);
  assert.throws(() => parseDataFile("hola"), /formato/);
  assert.throws(() => parseDataFile('export const products = {"a": 1};\n'), /formato/);
  assert.throws(() => parseDataFile(""), /formato/);
});

test("the published data files are in the generated format", () => {
  assert.deepEqual(parseDataFile(readFileSync("src/data/products.js", "utf8")), products);
  assert.deepEqual(parseDataFile(readFileSync("src/data/categories.js", "utf8")), categories);
});

test("rewriting the published data files changes nothing", () => {
  assert.equal(serializeDataFile("products", products), readFileSync("src/data/products.js", "utf8"));
  assert.equal(serializeDataFile("categories", categories), readFileSync("src/data/categories.js", "utf8"));
});
