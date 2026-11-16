// The only place of the panel that talks to GitHub. It receives `fetch` so the
// tests can replace it; in the browser it is the real one.
//
//   const client = createGithubClient({ fetch: window.fetch.bind(window), token });
//   await client.validateToken();           // throws GithubError
//   const catalog = await client.loadCatalog();
//   await client.publish({ base: catalog, products, categories, newImages, removedImages, message });
//
// The token is sent only to api.github.com, in the Authorization header.
import { parseDataFile, serializeDataFile } from "../src/lib/data-file.js";

const API = "https://api.github.com";
const REPOSITORY = "Rodolfotech/datosonline";
const BRANCH = "main";
export const PRODUCTS_FILE = "src/data/products.js";
export const CATEGORIES_FILE = "src/data/categories.js";
// Photos live in img/<folder>/<file>. The panel never writes or deletes
// anything else besides the two data files.
const IMAGE_PATH = /^img\/(?!.*\.\.)[^/]+(?:\/[^/]+)+$/;
const FILE_MODE = "100644";

const MESSAGES = {
  "invalid-token": "El token no es válido o está vencido. Genera uno nuevo en GitHub y vuelve a pegarlo.",
  "no-access": "El token no tiene acceso al repositorio datosonline. Revisa que lo hayas elegido al crear el token.",
  "read-only": 'El token solo permite leer. Necesita el permiso "Contents: Read and write".',
  offline: "No hay conexión con GitHub. Revisa tu internet e inténtalo de nuevo.",
  "rate-limit": "GitHub está limitando las solicitudes. Espera unos minutos e inténtalo de nuevo.",
  github: "GitHub no pudo responder en este momento. Inténtalo de nuevo en unos minutos.",
  conflict: "El catálogo cambió desde que lo abriste, por ejemplo desde otro dispositivo. Nada se publicó.",
};

// Error with a message for the owner (in Spanish) and a `code` for the panel.
export class GithubError extends Error {
  constructor(code, message = MESSAGES[code]) {
    super(message);
    this.name = "GithubError";
    this.code = code;
  }
}

// GitHub sends file contents as base64 broken into lines; the text is UTF-8.
function decodeBase64(content) {
  const binary = atob(content.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function createGithubClient({ fetch, token, repository = REPOSITORY, branch = BRANCH }) {
  const cleanToken = String(token ?? "").trim();
  const repositoryUrl = `${API}/repos/${repository}`;

  // Calls GitHub and returns the parsed answer. `denied` is the error code to
  // use when GitHub answers 403 or 404, and `rejected` when it answers 409 or
  // 422; both depend on what was asked.
  async function request(method, path, { body, denied = "no-access", rejected = "github" } = {}) {
    if (!cleanToken) throw new GithubError("invalid-token");

    let response;
    try {
      response = await fetch(repositoryUrl + path, {
        method,
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new GithubError("offline");
    }

    if (response.ok) return response.json();
    if (response.status === 401) throw new GithubError("invalid-token");
    const isRateLimited = response.status === 429 || (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0");
    if (isRateLimited) throw new GithubError("rate-limit");
    if (response.status === 403 || response.status === 404) throw new GithubError(denied);
    if (response.status === 409 || response.status === 422) throw new GithubError(rejected);
    throw new GithubError("github");
  }

  // Checks that the token is valid, reaches the repository and can write.
  // The write check stores an empty object that no file points to, so nothing
  // changes in the repository or on the site.
  async function validateToken() {
    await request("GET", "");
    await request("POST", "/git/blobs", { body: { content: "", encoding: "utf-8" }, denied: "read-only" });
  }

  async function readDataFile(path, commitSha) {
    const formatError = (detail) => new GithubError("format", `No se pudo leer ${path}: ${detail}`);
    let file;
    try {
      file = await request("GET", `/contents/${path}?ref=${commitSha}`, { denied: "missing" });
      // Files over 1 MB come without content: read them from their blob.
      if (file.encoding !== "base64" || !file.content) {
        const blob = await request("GET", `/git/blobs/${file.sha}`, { denied: "missing" });
        file = { ...file, content: blob.content };
      }
    } catch (error) {
      if (error.code === "missing") throw formatError("el archivo no existe en el repositorio.");
      throw error;
    }
    try {
      return { sha: file.sha, value: parseDataFile(decodeBase64(file.content)) };
    } catch {
      throw formatError("fue editado a mano y ya no tiene el formato que el panel entiende.");
    }
  }

  // Reads the catalog as it is in the repository right now (not the published
  // site, which can be some minutes behind). `commitSha` and `fileShas` let
  // the panel notice later whether someone else changed the catalog.
  async function loadCatalog() {
    const reference = await request("GET", `/git/ref/heads/${branch}`);
    const commitSha = reference.object.sha;
    const productsFile = await readDataFile(PRODUCTS_FILE, commitSha);
    const categoriesFile = await readDataFile(CATEGORIES_FILE, commitSha);

    return {
      commitSha,
      products: productsFile.value,
      categories: categoriesFile.value,
      fileShas: { [PRODUCTS_FILE]: productsFile.sha, [CATEGORIES_FILE]: categoriesFile.sha },
    };
  }

  const write = (path, body, options = {}) => request("POST", path, { body, denied: "read-only", ...options });

  // Returns the commit main points to now, its tree and the path -> sha of
  // every file in it.
  async function readHead() {
    const reference = await request("GET", `/git/ref/heads/${branch}`);
    const commitSha = reference.object.sha;
    const commit = await request("GET", `/git/commits/${commitSha}`);
    const tree = await request("GET", `/git/trees/${commit.tree.sha}?recursive=1`);
    if (tree.truncated) throw new GithubError("github", "El repositorio tiene demasiados archivos para publicar desde el panel.");
    return { commitSha, treeSha: commit.tree.sha, files: new Map(tree.tree.map((entry) => [entry.path, entry.sha])) };
  }

  // Saves a change to the catalog as ONE commit: the two data files, the new
  // photos and the deleted photos. Main moves only in the last step, so if
  // anything fails before, the site stays exactly as it was.
  //   base:          what loadCatalog() returned when the panel read the catalog
  //   newImages:     [{ path: "img/do-008/1-abc123.webp", base64 }]
  //   removedImages: ["img/do-001/a.webp"]
  async function publish({ base, products, categories, newImages = [], removedImages = [], message }) {
    for (const path of [...newImages.map((image) => image.path), ...removedImages]) {
      if (!IMAGE_PATH.test(path)) throw new Error(`Ruta de foto no permitida: ${path}`);
    }

    const head = await readHead();
    // Someone else changed the catalog since the panel read it: stop before
    // writing anything, so their work is not overwritten.
    const dataFiles = [PRODUCTS_FILE, CATEGORIES_FILE];
    if (dataFiles.some((path) => head.files.get(path) !== base.fileShas[path])) throw new GithubError("conflict");

    const entries = [
      { path: PRODUCTS_FILE, mode: FILE_MODE, type: "blob", content: serializeDataFile("products", products) },
      { path: CATEGORIES_FILE, mode: FILE_MODE, type: "blob", content: serializeDataFile("categories", categories) },
    ];
    // Uploaded photos are loose objects: they are not on the site until the
    // commit that references them becomes main.
    for (const image of newImages) {
      const blob = await write("/git/blobs", { content: image.base64, encoding: "base64" });
      entries.push({ path: image.path, mode: FILE_MODE, type: "blob", sha: blob.sha });
    }
    // GitHub fails when asked to delete a file that is not there.
    for (const path of removedImages.filter((path) => head.files.has(path))) {
      entries.push({ path, mode: FILE_MODE, type: "blob", sha: null });
    }

    const tree = await write("/git/trees", { base_tree: head.treeSha, tree: entries });
    const commit = await write("/git/commits", { message, tree: tree.sha, parents: [head.commitSha] });
    // Without `force`, GitHub rejects the move if main advanced meanwhile.
    await request("PATCH", `/git/refs/heads/${branch}`, { body: { sha: commit.sha, force: false }, denied: "read-only", rejected: "conflict" });
    return { commitSha: commit.sha };
  }

  return { validateToken, loadCatalog, publish };
}
