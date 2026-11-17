import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const publicPages = ["index.html", ...readdirSync("guias").filter((f) => f.endsWith(".html")).map((f) => `guias/${f}`)];

test("every public page loads the cookie module, which holds the measurement tools", () => {
  for (const page of publicPages) assert.ok(readFileSync(page, "utf8").includes('src/cookies.js'), page);
  const cookies = readFileSync("src/cookies.js", "utf8");
  assert.ok(cookies.includes("zev4fb1ne8"), "Clarity id");
  assert.ok(cookies.includes("GTM-K5NHQ678"), "Tag Manager id");
  assert.ok(cookies.includes("if (readConsent") || cookies.includes("mayMeasure"), "only after acceptance");
});

test("no public page loads the measurement tools directly", () => {
  for (const page of publicPages) {
    const html = readFileSync(page, "utf8");
    assert.equal(html.includes("clarity.ms/tag"), false, page);
    assert.equal(html.includes("googletagmanager.com/gtm.js"), false, page);
  }
});

test("the panel has no analytics or tag manager script", () => {
  const panel = readFileSync("gestion-k7x2m9/index.html", "utf8") + readFileSync("gestion-k7x2m9/panel.js", "utf8");
  assert.equal(panel.includes("clarity"), false);
  assert.equal(panel.includes("googletagmanager"), false);
});

test("the privacy page has the sections the law requires (version, controller, data, basis, recipients, transfers, retention, rights)", () => {
  const page = readFileSync("privacidad.html", "utf8");
  for (const word of ["Microsoft Clarity", "Google Tag Manager", "Responsable de los datos", "Qué datos tratamos", "Base legal", "Cookies", "Quién recibe los datos", "Transferencia fuera de Chile", "Cuánto tiempo los guardamos", "Tus derechos"]) {
    assert.ok(page.includes(word), word);
  }
});

test("the footer links to the privacy page and the sitemap lists it", () => {
  assert.ok(readFileSync("src/components/footer.js", "utf8").includes("privacidad.html"));
  assert.ok(readFileSync("sitemap.xml", "utf8").includes("https://datosonline.cl/privacidad.html"));
});
