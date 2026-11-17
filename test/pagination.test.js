import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPage, pageNumbers, pageSlice, totalPages } from "../src/lib/pagination.js";

test("totalPages counts at least one page", () => {
  assert.equal(totalPages(0, 12), 1);
  assert.equal(totalPages(12, 12), 1);
  assert.equal(totalPages(13, 12), 2);
  assert.equal(totalPages(25, 12), 3);
});

test("clampPage keeps the page inside the range", () => {
  assert.equal(clampPage(0, 3), 1);
  assert.equal(clampPage(-4, 3), 1);
  assert.equal(clampPage(2, 3), 2);
  assert.equal(clampPage(99, 3), 3);
  assert.equal(clampPage(NaN, 3), 1);
  assert.equal(clampPage(2.7, 3), 2);
});

test("pageSlice returns the items of one page", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];
  assert.deepEqual(pageSlice(items, 1, 3), { items: [1, 2, 3], page: 1, pages: 3 });
  assert.deepEqual(pageSlice(items, 3, 3), { items: [7], page: 3, pages: 3 });
  assert.deepEqual(pageSlice(items, 9, 3), { items: [7], page: 3, pages: 3 });
  assert.deepEqual(pageSlice([], 1, 3), { items: [], page: 1, pages: 1 });
});

test("pageSlice does not change the list it receives", () => {
  const items = [1, 2, 3];
  pageSlice(items, 1, 2);
  assert.deepEqual(items, [1, 2, 3]);
});

test("pageNumbers shows every page when there are few", () => {
  assert.deepEqual(pageNumbers(1, 1), [1]);
  assert.deepEqual(pageNumbers(2, 4), [1, 2, 3, 4]);
});

test("pageNumbers puts ellipses where pages are skipped", () => {
  assert.deepEqual(pageNumbers(1, 10), [1, 2, "…", 10]);
  assert.deepEqual(pageNumbers(5, 10), [1, "…", 4, 5, 6, "…", 10]);
  assert.deepEqual(pageNumbers(10, 10), [1, "…", 9, 10]);
});
