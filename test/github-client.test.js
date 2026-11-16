import assert from "node:assert/strict";
import { test } from "node:test";
import { GithubError, createGithubClient } from "../gestion-k7x2m9/github-client.js";
import { serializeDataFile } from "../src/lib/data-file.js";

// Fake `fetch` that answers like the GitHub API, for the panel tests.
// routes: { "GET /repos/o/r": (call) => reply(200, {...}) | Response | throws }
const API = "https://api.github.com";

function reply(status, body = {}, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

function toBase64(text) {
  // GitHub breaks the base64 content into lines.
  return Buffer.from(text, "utf8").toString("base64").replace(/(.{60})/g, "$1\n");
}

function fakeGithub(routes) {
  const calls = [];
  const fetch = async (url, options = {}) => {
    const method = options.method ?? "GET";
    const path = String(url).startsWith(API) ? String(url).slice(API.length) : String(url);
    const call = { method, url: String(url), path, headers: options.headers ?? {}, body: options.body ? JSON.parse(options.body) : undefined };
    calls.push(call);
    const route = routes[`${method} ${path}`];
    if (!route) return reply(404, { message: "Not Found" });
    return route(call);
  };
  return { fetch, calls };
}

const REPO = "/repos/Rodolfotech/datosonline";
const TOKEN = "github_pat_TEST";
const COMMIT = "c".repeat(40);
const products = [{ code: "DO-001", title: "Colchón «Emma» 6,9\"", category: "colchones", url: "https://meli.la/abc" }];
const categories = [{ slug: "colchones", name: "Colchones" }];
const productsText = serializeDataFile("products", products);
const categoriesText = serializeDataFile("categories", categories);

const okRoutes = {
  [`GET ${REPO}`]: () => reply(200, { full_name: "Rodolfotech/datosonline" }),
  [`POST ${REPO}/git/blobs`]: () => reply(201, { sha: "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391" }),
  [`GET ${REPO}/git/ref/heads/main`]: () => reply(200, { object: { type: "commit", sha: COMMIT } }),
  [`GET ${REPO}/contents/src/data/products.js?ref=${COMMIT}`]: () => reply(200, { sha: "p1", encoding: "base64", content: toBase64(productsText) }),
  [`GET ${REPO}/contents/src/data/categories.js?ref=${COMMIT}`]: () => reply(200, { sha: "c1", encoding: "base64", content: toBase64(categoriesText) }),
};

function setup(routes = {}, token = TOKEN) {
  const github = fakeGithub({ ...okRoutes, ...routes });
  return { ...github, client: createGithubClient({ fetch: github.fetch, token }) };
}

async function errorCode(promise) {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof GithubError, `unexpected error: ${error}`);
    assert.ok(error.message.length > 15, "the error needs a message for the owner");
    return error.code;
  }
  return "no error";
}

test("validateToken accepts a token that can read and write", async () => {
  const { client, calls } = setup();
  await client.validateToken();
  assert.deepEqual(calls.map((call) => `${call.method} ${call.path}`), [`GET ${REPO}`, `POST ${REPO}/git/blobs`]);
  // The write check stores an empty object: nothing visible changes.
  assert.deepEqual(calls[1].body, { content: "", encoding: "utf-8" });
});

test("the token travels only to api.github.com, in the Authorization header", async () => {
  const { client, calls } = setup();
  await client.validateToken();
  await client.loadCatalog();
  assert.ok(calls.length >= 5);
  for (const call of calls) {
    assert.ok(call.url.startsWith("https://api.github.com/"), call.url);
    assert.equal(call.headers.Authorization, `Bearer ${TOKEN}`);
    assert.equal(call.url.includes(TOKEN), false);
    assert.equal(JSON.stringify(call.body ?? "").includes(TOKEN), false);
  }
});

test("the token is cleaned before use", async () => {
  const { client, calls } = setup({}, `  ${TOKEN}\n`);
  await client.validateToken();
  assert.equal(calls[0].headers.Authorization, `Bearer ${TOKEN}`);
});

test("an empty token is rejected without calling GitHub", async () => {
  const { client, calls } = setup({}, "   ");
  assert.equal(await errorCode(client.validateToken()), "invalid-token");
  assert.equal(calls.length, 0);
});

test("an invalid or expired token is explained", async () => {
  const { client } = setup({ [`GET ${REPO}`]: () => reply(401, { message: "Bad credentials" }) });
  assert.equal(await errorCode(client.validateToken()), "invalid-token");
});

test("a token without access to the repository is explained", async () => {
  for (const status of [403, 404]) {
    const { client } = setup({ [`GET ${REPO}`]: () => reply(status, { message: "Not Found" }) });
    assert.equal(await errorCode(client.validateToken()), "no-access", String(status));
  }
});

test("a read-only token is explained", async () => {
  for (const status of [403, 404]) {
    const { client } = setup({ [`POST ${REPO}/git/blobs`]: () => reply(status, { message: "Resource not accessible by personal access token" }) });
    assert.equal(await errorCode(client.validateToken()), "read-only", String(status));
  }
});

test("no connection is explained", async () => {
  const { client } = setup({
    [`GET ${REPO}`]: () => {
      throw new TypeError("Failed to fetch");
    },
  });
  assert.equal(await errorCode(client.validateToken()), "offline");
});

test("GitHub failures and rate limits are explained", async () => {
  const down = setup({ [`GET ${REPO}`]: () => reply(503, {}) });
  assert.equal(await errorCode(down.client.validateToken()), "github");
  const limited = setup({ [`GET ${REPO}`]: () => reply(403, { message: "API rate limit exceeded" }, { "x-ratelimit-remaining": "0" }) });
  assert.equal(await errorCode(limited.client.validateToken()), "rate-limit");
  const tooMany = setup({ [`GET ${REPO}`]: () => reply(429, {}) });
  assert.equal(await errorCode(tooMany.client.validateToken()), "rate-limit");
});

test("loadCatalog reads both data files from the same commit", async () => {
  const { client, calls } = setup();
  const catalog = await client.loadCatalog();
  assert.deepEqual(catalog, {
    commitSha: COMMIT,
    products,
    categories,
    fileShas: { "src/data/products.js": "p1", "src/data/categories.js": "c1" },
  });
  assert.equal(calls[0].path, `${REPO}/git/ref/heads/main`);
  assert.ok(calls.slice(1).every((call) => call.path.endsWith(`?ref=${COMMIT}`)));
  assert.ok(calls.every((call) => call.method === "GET"));
});

test("loadCatalog reads a file too large for the contents endpoint from its blob", async () => {
  const { client } = setup({
    [`GET ${REPO}/contents/src/data/products.js?ref=${COMMIT}`]: () => reply(200, { sha: "big", encoding: "none", content: "" }),
    [`GET ${REPO}/git/blobs/big`]: () => reply(200, { sha: "big", encoding: "base64", content: toBase64(productsText) }),
  });
  assert.deepEqual((await client.loadCatalog()).products, products);
});

test("loadCatalog explains a data file edited by hand out of format", async () => {
  const { client } = setup({
    [`GET ${REPO}/contents/src/data/products.js?ref=${COMMIT}`]: () => reply(200, { sha: "p1", encoding: "base64", content: toBase64("export const products = [{ code: 'x' }];") }),
  });
  try {
    await client.loadCatalog();
    assert.fail("should have failed");
  } catch (error) {
    assert.equal(error.code, "format");
    assert.match(error.message, /src\/data\/products\.js/);
  }
});

test("loadCatalog explains a missing data file", async () => {
  const { client } = setup({ [`GET ${REPO}/contents/src/data/categories.js?ref=${COMMIT}`]: () => reply(404, {}) });
  assert.equal(await errorCode(client.loadCatalog()), "format");
});

test("loadCatalog reports an expired token", async () => {
  const { client } = setup({ [`GET ${REPO}/git/ref/heads/main`]: () => reply(401, {}) });
  assert.equal(await errorCode(client.loadCatalog()), "invalid-token");
});

// ---------- publish ----------
const TREE = "t".repeat(40);
const NEW_TREE = "n".repeat(40);
const NEW_COMMIT = "d".repeat(40);
const base = { commitSha: COMMIT, fileShas: { "src/data/products.js": "p1", "src/data/categories.js": "c1" } };
const headTree = [
  { path: "index.html", type: "blob", sha: "i1" },
  { path: "src/data/products.js", type: "blob", sha: "p1" },
  { path: "src/data/categories.js", type: "blob", sha: "c1" },
  { path: "img/do-001/a.webp", type: "blob", sha: "a1" },
  { path: "img/do-001/b.webp", type: "blob", sha: "b1" },
];
const change = {
  base,
  products: [{ code: "DO-002", title: "Nuevo", category: "colchones", url: "https://meli.la/n", images: ["img/do-002/1-abc123.webp"] }, ...products],
  categories,
  newImages: [{ path: "img/do-002/1-abc123.webp", base64: "AAAA" }],
  removedImages: ["img/do-001/a.webp"],
  message: 'Panel: agrega "Nuevo"',
};

function publishRoutes(head = COMMIT, tree = headTree) {
  let blobCount = 0;
  return {
    [`GET ${REPO}/git/ref/heads/main`]: () => reply(200, { object: { type: "commit", sha: head } }),
    [`GET ${REPO}/git/commits/${head}`]: () => reply(200, { sha: head, tree: { sha: TREE } }),
    [`GET ${REPO}/git/trees/${TREE}?recursive=1`]: () => reply(200, { sha: TREE, truncated: false, tree }),
    [`POST ${REPO}/git/blobs`]: () => reply(201, { sha: `blob${++blobCount}` }),
    [`POST ${REPO}/git/trees`]: () => reply(201, { sha: NEW_TREE }),
    [`POST ${REPO}/git/commits`]: () => reply(201, { sha: NEW_COMMIT }),
    [`PATCH ${REPO}/git/refs/heads/main`]: () => reply(200, { object: { sha: NEW_COMMIT } }),
  };
}
const steps = (calls) => calls.map((call) => `${call.method} ${call.path.replace(REPO, "")}`);
const writes = (calls) => calls.filter((call) => call.method !== "GET");
const movedMain = (calls) => calls.some((call) => call.method === "PATCH");

test("publish stores data and photos in one commit and moves main last", async () => {
  const { client, calls } = setup(publishRoutes());
  const result = await client.publish(change);
  assert.deepEqual(result, { commitSha: NEW_COMMIT });
  assert.deepEqual(steps(calls), [
    "GET /git/ref/heads/main",
    `GET /git/commits/${COMMIT}`,
    `GET /git/trees/${TREE}?recursive=1`,
    "POST /git/blobs",
    "POST /git/trees",
    "POST /git/commits",
    "PATCH /git/refs/heads/main",
  ]);

  const [blob, tree, commit, move] = writes(calls).map((call) => call.body);
  assert.deepEqual(blob, { content: "AAAA", encoding: "base64" });
  assert.equal(tree.base_tree, TREE);
  assert.deepEqual(tree.tree, [
    { path: "src/data/products.js", mode: "100644", type: "blob", content: serializeDataFile("products", change.products) },
    { path: "src/data/categories.js", mode: "100644", type: "blob", content: serializeDataFile("categories", categories) },
    { path: "img/do-002/1-abc123.webp", mode: "100644", type: "blob", sha: "blob1" },
    { path: "img/do-001/a.webp", mode: "100644", type: "blob", sha: null },
  ]);
  assert.deepEqual(commit, { message: 'Panel: agrega "Nuevo"', tree: NEW_TREE, parents: [COMMIT] });
  assert.deepEqual(move, { sha: NEW_COMMIT, force: false });
});

test("publish stops without writing when someone else changed the catalog", async () => {
  const changedTree = headTree.map((entry) => (entry.path === "src/data/products.js" ? { ...entry, sha: "p2" } : entry));
  const { client, calls } = setup(publishRoutes("e".repeat(40), changedTree));
  assert.equal(await errorCode(client.publish(change)), "conflict");
  assert.deepEqual(writes(calls), []);
});

test("publish stops when a data file disappeared from the repository", async () => {
  const { client, calls } = setup(publishRoutes(COMMIT, headTree.filter((entry) => entry.path !== "src/data/categories.js")));
  assert.equal(await errorCode(client.publish(change)), "conflict");
  assert.deepEqual(writes(calls), []);
});

test("publish builds on a newer commit when the catalog files did not change", async () => {
  const newerHead = "e".repeat(40);
  const { client, calls } = setup(publishRoutes(newerHead));
  await client.publish(change);
  assert.deepEqual(calls.find((call) => call.path.endsWith("/git/commits") && call.method === "POST").body.parents, [newerHead]);
});

test("publish treats a rejected move of main as a change made by someone else", async () => {
  for (const status of [409, 422]) {
    const { client } = setup({ ...publishRoutes(), [`PATCH ${REPO}/git/refs/heads/main`]: () => reply(status, { message: "Update is not a fast forward" }) });
    assert.equal(await errorCode(client.publish(change)), "conflict", String(status));
  }
});

test("a failure in any step before the last one leaves main untouched", async () => {
  const failures = [
    [`GET ${REPO}/git/commits/${COMMIT}`, () => reply(500, {}), "github"],
    [`POST ${REPO}/git/blobs`, () => reply(403, {}), "read-only"],
    [`POST ${REPO}/git/blobs`, () => { throw new TypeError("Failed to fetch"); }, "offline"],
    [`POST ${REPO}/git/trees`, () => reply(422, {}), "github"],
    [`POST ${REPO}/git/trees`, () => reply(401, {}), "invalid-token"],
    [`POST ${REPO}/git/commits`, () => reply(502, {}), "github"],
  ];
  for (const [route, handler, code] of failures) {
    const { client, calls } = setup({ ...publishRoutes(), [route]: handler });
    assert.equal(await errorCode(client.publish(change)), code, route);
    assert.equal(movedMain(calls), false, route);
  }
});

test("publish only deletes photos that still exist", async () => {
  const { client, calls } = setup(publishRoutes());
  await client.publish({ ...change, removedImages: ["img/do-001/a.webp", "img/do-001/gone.webp"] });
  const tree = calls.find((call) => call.path.endsWith("/git/trees") && call.method === "POST").body.tree;
  assert.deepEqual(tree.filter((entry) => entry.sha === null).map((entry) => entry.path), ["img/do-001/a.webp"]);
});

test("publish works without photos", async () => {
  const { client, calls } = setup(publishRoutes());
  await client.publish({ base, products, categories, message: 'Panel: edita "x"' });
  assert.deepEqual(steps(writes(calls)), ["POST /git/trees", "POST /git/commits", "PATCH /git/refs/heads/main"]);
});

test("publish refuses to write or delete anything outside the img folder", async () => {
  const risky = [
    { newImages: [{ path: "src/main.js", base64: "AAAA" }] },
    { newImages: [{ path: "img/../index.html", base64: "AAAA" }] },
    { newImages: [{ path: "/img/a.webp", base64: "AAAA" }] },
    { removedImages: ["index.html"] },
    { removedImages: ["img/../src/data/products.js"] },
    { removedImages: ["img"] },
  ];
  for (const extra of risky) {
    const { client, calls } = setup(publishRoutes());
    await assert.rejects(client.publish({ ...change, newImages: [], removedImages: [], ...extra }), JSON.stringify(extra));
    assert.deepEqual(writes(calls), [], JSON.stringify(extra));
  }
});

test("publish reports a repository too large to compare safely", async () => {
  const { client, calls } = setup({ ...publishRoutes(), [`GET ${REPO}/git/trees/${TREE}?recursive=1`]: () => reply(200, { truncated: true, tree: headTree }) });
  assert.equal(await errorCode(client.publish(change)), "github");
  assert.deepEqual(writes(calls), []);
});

test("the token never leaves api.github.com while publishing", async () => {
  const { client, calls } = setup(publishRoutes());
  await client.publish(change);
  for (const call of calls) {
    assert.ok(call.url.startsWith("https://api.github.com/"), call.url);
    assert.equal(call.headers.Authorization, `Bearer ${TOKEN}`);
    assert.equal(JSON.stringify(call.body ?? "").includes(TOKEN), false);
  }
});
