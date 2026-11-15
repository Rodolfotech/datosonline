import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryUrl, escapeHtml, getActiveCategorySlug, splitCategories } from "../src/lib/categories.js";

const categories = ["a", "b", "c", "d", "e"].map((slug) => ({ slug, name: slug.toUpperCase() }));
const slugs = (list) => list.map((category) => category.slug);

test("getActiveCategorySlug returns the slug from the URL", () => {
  assert.equal(getActiveCategorySlug("?categoria=b", categories), "b");
});

test("getActiveCategorySlug falls back to all products for unknown or missing slugs", () => {
  assert.equal(getActiveCategorySlug("?categoria=zzz", categories), "");
  assert.equal(getActiveCategorySlug("", categories), "");
});

test("categoryUrl builds the link for a category and for all products", () => {
  assert.equal(categoryUrl("tecnologia"), "./?categoria=tecnologia");
  assert.equal(categoryUrl(""), "./");
});

test("splitCategories moves the extra categories to overflow", () => {
  const { visible, overflow } = splitCategories(categories, 3);
  assert.deepEqual(slugs(visible), ["a", "b", "c"]);
  assert.deepEqual(slugs(overflow), ["d", "e"]);
});

test("splitCategories keeps the active category visible", () => {
  const { visible, overflow } = splitCategories(categories, 3, "e");
  assert.deepEqual(slugs(visible), ["a", "b", "e"]);
  assert.deepEqual(slugs(overflow), ["c", "d"]);
});

test("splitCategories has no overflow when everything fits", () => {
  const { visible, overflow } = splitCategories(categories.slice(0, 2), 4);
  assert.equal(visible.length, 2);
  assert.equal(overflow.length, 0);
});

test("escapeHtml escapes markup characters", () => {
  assert.equal(escapeHtml('<a href="x">&</a>'), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
});
