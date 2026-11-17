// Admin panel: decides which view to show (sign-in or catalog) and connects
// the views with GitHub. It is the only file of the panel that touches the DOM.
import { confirmDialog } from "../src/components/confirm-dialog.js";
import {
  addProduct,
  describeChange,
  nextProductCode,
  removeProduct,
  removedImagePaths,
  resolveCategory,
  slugify,
  updateProduct,
} from "../src/lib/catalog.js";
import { escapeHtml } from "../src/lib/categories.js";
import {
  MAX_IMAGES,
  NEW_CATEGORY,
  RIBBON_POSITIONS,
  canAddImage,
  emptyProductForm,
  isNewPhoto,
  newPhotoKey,
  assignPhotoPaths,
  formToProduct,
  productToForm,
  validateProductForm,
} from "../src/lib/product-form.js";
import { normalizeProduct, productCountLabel } from "../src/lib/products.js";
import "../src/components/product-card.js";
import { GithubError, createGithubClient } from "./github-client.js";
import { preparePhoto } from "./photos.js";
import { clearToken, readToken, saveToken } from "./session.js";

const TOKEN_HELP_URL = "https://github.com/settings/personal-access-tokens";
const PUBLISHED_NOTICE = "El cambio se verá en datosonline.cl en unos minutos.";
// The panel lives one folder below the site, where the photos are.
const SITE_ROOT = "../";
const PHOTO_PLACEHOLDER = `<svg aria-hidden="true" viewBox="0 0 24 24" class="product-row__placeholder" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5.5-5 3.5 3 2.5-2 4.5 4"/></svg>`;
const root = document.querySelector("#panel");
window.addEventListener("dragover", (event) => event.preventDefault());
window.addEventListener("drop", (event) => event.preventDefault());

// What the panel knows while the session is open.
const state = { client: null, catalog: null, form: null };
let saving = false;

function createClient(token) {
  return createGithubClient({ fetch: (...args) => window.fetch(...args), token });
}

// ---------- Sign-in ----------
function showSignIn(message = "") {
  state.client = null;
  state.catalog = null;
  root.innerHTML = `
    <section class="panel__card panel__signin" aria-labelledby="signin-title">
      <p class="panel__brand"><span aria-hidden="true" class="logo__mark">D</span> Panel de administración</p>
      <h1 id="signin-title" class="panel__title">Entrar</h1>
      <form data-signin novalidate class="panel__form">
        <label for="token" class="field__label">Token de GitHub</label>
        <input id="token" name="token" type="password" required autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="token-help signin-error" class="field__input" />
        <p id="token-help" class="field__help">Pega el token del panel. Se guarda solo mientras esta pestaña esté abierta.</p>
        <p id="signin-error" role="alert" class="panel__error">${escapeHtml(message)}</p>
        <button type="submit" class="button button--primary">Entrar</button>
      </form>
      <p class="panel__note">¿No tienes token o venció? Créalo en <a href="${TOKEN_HELP_URL}" target="_blank" rel="noopener noreferrer">GitHub</a>; los pasos están en el archivo README del repositorio.</p>
    </section>`;
  root.querySelector("[data-signin]").addEventListener("submit", handleSignIn);
  root.querySelector("#token").focus();
}

async function handleSignIn(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const error = form.querySelector("#signin-error");
  const token = form.elements.token.value.trim();

  if (!token) {
    error.textContent = "Pega tu token de GitHub para entrar.";
    return;
  }

  error.textContent = "";
  button.disabled = true;
  button.textContent = "Comprobando…";
  const client = createClient(token);
  try {
    await client.validateToken();
  } catch (failure) {
    error.textContent = failure.message;
    button.disabled = false;
    button.textContent = "Entrar";
    return;
  }
  saveToken(token);
  await openCatalog(client);
}

function signOut() {
  clearToken();
  closeProductForm();
  showSignIn();
}

// ---------- Catalog ----------
async function openCatalog(client) {
  state.client = client;
  root.innerHTML = `<p role="status" class="panel__loading">Cargando el catálogo…</p>`;
  try {
    state.catalog = await client.loadCatalog();
  } catch (failure) {
    // A token that stopped working sends the owner back to the sign-in.
    if (failure.code === "invalid-token" || failure.code === "no-access") {
      clearToken();
      showSignIn(failure.message);
      return;
    }
    showCatalogError(failure.message);
    return;
  }
  // Coming back from a sign-in that happened during a save: the form is still here.
  if (state.form) {
    showProductForm({ notice: "Entraste de nuevo. Lo que escribiste sigue aquí: revisa y vuelve a publicar." });
  } else {
    showCatalog();
  }
}

function panelHeader() {
  return `
    <header class="panel__header">
      <p class="panel__brand"><span aria-hidden="true" class="logo__mark">D</span> Panel de administración</p>
      <button type="button" data-signout class="button">Cerrar sesión</button>
    </header>`;
}

function showCatalogError(message) {
  root.innerHTML = `
    ${panelHeader()}
    <section class="panel__card">
      <p role="alert" class="panel__error">${escapeHtml(message)}</p>
      <button type="button" data-retry class="button button--primary">Reintentar</button>
    </section>`;
  root.querySelector("[data-retry]").addEventListener("click", () => openCatalog(state.client));
  root.querySelector("[data-signout]").addEventListener("click", signOut);
}

function coverPhoto(product) {
  const images = Array.isArray(product.images) ? product.images : [product.image];
  return images.find((image) => typeof image === "string" && image.trim() !== "") ?? "";
}

function productRow(product) {
  const { categories } = state.catalog;
  const categoryName = categories.find((category) => category.slug === product.category)?.name ?? product.category;
  const cover = coverPhoto(product);
  const safeTitle = escapeHtml(product.title);
  return `
    <li class="product-row">
      <div class="product-row__photo">
        ${cover ? `<img src="${escapeHtml(SITE_ROOT + cover)}" alt="" loading="lazy" />` : PHOTO_PLACEHOLDER}
      </div>
      <div class="product-row__text">
        <p class="product-row__title">${safeTitle}</p>
        <p class="product-row__meta">${escapeHtml(categoryName)}</p>
        ${product.available === false ? `<p class="product-row__flag">No disponible</p>` : ""}
      </div>
      <div class="product-row__actions">
        <button type="button" data-edit="${escapeHtml(product.code)}" aria-label="Editar ${safeTitle}" class="button">Editar</button>
        <button type="button" data-remove="${escapeHtml(product.code)}" aria-label="Eliminar ${safeTitle}" class="button button--danger">Eliminar</button>
      </div>
    </li>`;
}

// `notice` is a confirmation and `error` a problem; both are optional.
function showCatalog({ notice = "", error = "" } = {}) {
  const { products } = state.catalog;
  root.innerHTML = `
    ${panelHeader()}
    <section class="panel__card" aria-labelledby="catalog-title">
      <div class="panel__heading">
        <h1 id="catalog-title" class="panel__title">Productos</h1>
        <button type="button" data-add class="button button--primary">Agregar producto</button>
      </div>
      <p class="panel__count">${productCountLabel(products.length)} en el catálogo</p>
      <p role="status" class="panel__notice">${escapeHtml(notice)}</p>
      <p role="alert" class="panel__error">${escapeHtml(error)}</p>
      ${products.length === 0
        ? `<p class="panel__empty">Todavía no hay productos en el catálogo.</p>`
        : `<ul class="product-list">${products.map(productRow).join("")}</ul>`}
    </section>`;
  root.querySelector("[data-signout]").addEventListener("click", signOut);
  root.querySelector("[data-add]").addEventListener("click", () => openProductForm());
  for (const button of root.querySelectorAll("[data-edit]")) {
    button.addEventListener("click", () => openProductForm(button.dataset.edit));
  }
  for (const button of root.querySelectorAll("[data-remove]")) {
    button.addEventListener("click", () => handleRemove(button.dataset.remove));
  }
  // A photo that is not on the site yet (just published) shows the placeholder.
  for (const image of root.querySelectorAll(".product-row__photo img")) {
    image.addEventListener("error", () => {
      image.outerHTML = PHOTO_PLACEHOLDER;
    });
  }
}

// While a change is being saved nothing else can be started.
function setBusy(message) {
  for (const button of root.querySelectorAll("button")) button.disabled = true;
  root.querySelector(".panel__error").textContent = "";
  root.querySelector(".panel__notice").textContent = message;
}

// Shows the catalog again after a failed save. When the token stopped
// working the owner goes back to the sign-in instead.
async function recoverFromFailure(failure) {
  if (failure.code === "invalid-token" || failure.code === "no-access") {
    clearToken();
    showSignIn(failure.message);
    return;
  }
  // Someone else changed the catalog: show it as it is now.
  if (failure.code === "conflict") {
    try {
      state.catalog = await state.client.loadCatalog();
    } catch {
      // The list on screen is still the last one that could be read.
    }
  }
  showCatalog({ error: failure.message });
}

async function handleRemove(code) {
  const product = state.catalog.products.find((item) => item.code === code);
  if (!product) return;

  const accepted = await confirmDialog({
    title: "Eliminar producto",
    message: "¿Estás seguro de eliminar el producto? Nada se podrá recuperar.",
    detail: product.title,
    confirmLabel: "Eliminar",
    cancelLabel: "Cancelar",
    tone: "danger",
  });
  if (!accepted) return;

  setBusy("Eliminando…");
  try {
    const { products, removedImages } = removeProduct(state.catalog.products, code);
    await state.client.publish({
      base: state.catalog,
      products,
      categories: state.catalog.categories,
      removedImages,
      message: describeChange("remove", product),
    });
    state.catalog = await state.client.loadCatalog();
  } catch (failure) {
    await recoverFromFailure(failure);
    return;
  }
  showCatalog({ notice: `Se eliminó "${product.title}". ${PUBLISHED_NOTICE}` });
}

// ---------- Product form ----------
const BADGE_TONES = [
  ["hot", "Naranja"],
  ["top", "Amarillo"],
  ["new", "Verde"],
  ["value", "Violeta"],
  ["gray", "Gris"],
  ["black", "Negro"],
  ["silver", "Plateado"],
];
const RIBBON_LABELS = { horizontal: "A media foto", diagonal: "En diagonal" };

// Opens the form empty (new product) or loaded with an existing product.
function openProductForm(code = "") {
  const product = state.catalog.products.find((item) => item.code === code);
  const values = product ? productToForm(product) : emptyProductForm();
  state.form = { code: product ? product.code : "", values, initial: JSON.stringify(values), photos: {}, photoMessage: "" };
  showProductForm();
  root.querySelector("#title").focus();
}

const isEditing = () => state.form.code !== "";
const hasUnsavedChanges = () => JSON.stringify(state.form.values) !== state.form.initial;

function errorFor(errors, field) {
  return errors.find((error) => error.field === field)?.message ?? "";
}

// Attributes and message that tie a control to its error, if it has one.
function errorAttributes(errors, field, id) {
  return errorFor(errors, field) ? ` aria-invalid="true" aria-describedby="${id}-error"` : "";
}

function errorMessage(errors, field, id) {
  const message = errorFor(errors, field);
  return message ? `<p id="${id}-error" class="field__error">${escapeHtml(message)}</p>` : "";
}

function textField({ id, label, value, errors = [], field = id, help = "", optional = false, type = "text" }) {
  return `
    <div class="field">
      <label for="${id}" class="field__label">${label}${optional ? ' <span class="field__optional">(opcional)</span>' : ""}</label>
      <input id="${id}" type="${type}" value="${escapeHtml(value)}" data-field="${field}" autocomplete="off"${errorAttributes(errors, field, id)} class="field__input" />
      ${help ? `<p class="field__help">${help}</p>` : ""}
      ${errorMessage(errors, field, id)}
    </div>`;
}

function categoryFields(values, errors) {
  const options = state.catalog.categories
    .map((category) => `<option value="${escapeHtml(category.slug)}"${category.slug === values.category ? " selected" : ""}>${escapeHtml(category.name)}</option>`)
    .join("");
  const isNew = values.category === NEW_CATEGORY;
  return `
    <div class="field">
      <label for="category" class="field__label">Categoría</label>
      <select id="category" data-field="category" data-redraw${errorAttributes(errors, "category", "category")} class="field__input">
        <option value=""${values.category ? "" : " selected"}>Elige una categoría</option>
        ${options}
        <option value="${NEW_CATEGORY}"${isNew ? " selected" : ""}>Nueva categoría…</option>
      </select>
      ${errorMessage(errors, "category", "category")}
    </div>
    ${isNew ? textField({ id: "newCategory", label: "Nombre de la categoría nueva", value: values.newCategory, errors, help: "Si ya existe una con ese nombre, se usará la existente." }) : ""}`;
}

function variantFields(values, errors) {
  const single = values.variants.length === 1;
  const rows = values.variants
    .map((variant, index) => {
      const labelId = `variant-${index}-label`;
      const urlId = `variant-${index}-url`;
      return `
      <li class="variant-row">
        <div class="field">
          <label for="${labelId}" class="field__label">Versión${single ? ' <span class="field__optional">(opcional)</span>' : ` ${index + 1}`}</label>
          <input id="${labelId}" type="text" value="${escapeHtml(variant.label)}" placeholder="256 GB" data-variant-field="label" data-index="${index}" autocomplete="off"${errorAttributes(errors, `variants.${index}.label`, labelId)} class="field__input" />
          ${errorMessage(errors, `variants.${index}.label`, labelId)}
        </div>
        <div class="field">
          <label for="${urlId}" class="field__label">Enlace de Mercado Libre</label>
          <input id="${urlId}" type="url" inputmode="url" value="${escapeHtml(variant.url)}" placeholder="https://meli.la/…" data-variant-field="url" data-index="${index}" autocomplete="off" autocapitalize="off" spellcheck="false"${errorAttributes(errors, `variants.${index}.url`, urlId)} class="field__input" />
          ${errorMessage(errors, `variants.${index}.url`, urlId)}
        </div>
        ${single ? "" : `<button type="button" data-remove-item="variants" data-index="${index}" aria-label="Quitar la versión ${index + 1}" class="button button--small">Quitar</button>`}
      </li>`;
    })
    .join("");
  return `
    <fieldset class="group">
      <legend class="group__title">Enlace de afiliado</legend>
      <p class="field__help">Pega el enlace corto que entrega Mercado Libre.</p>
      <ul class="rows">${rows}</ul>
      ${errorMessage(errors, "variants", "variants")}
    </fieldset>`;
}

function badgeFields(values) {
  const tones = BADGE_TONES.map(([tone, name]) => `<option value="${tone}"${tone === values.badgeTone ? " selected" : ""}>${name}</option>`).join("");
  return `
    <fieldset class="group">
      <legend class="group__title">Etiqueta <span class="field__optional">(opcional)</span></legend>
      <div class="pair">
        ${textField({ id: "badgeLabel", label: "Texto", value: values.badgeLabel, help: 'Por ejemplo "Recomendado".' })}
        <div class="field">
          <label for="badgeTone" class="field__label">Color</label>
          <select id="badgeTone" data-field="badgeTone" class="field__input">${tones}</select>
        </div>
      </div>
    </fieldset>`;
}

// Only when editing: a new product is always published as available.
function availabilityFields(values, errors) {
  if (!isEditing()) return "";
  const ribbons = RIBBON_POSITIONS.map((position) => `
      <label class="choice">
        <input type="radio" name="ribbon" value="${position}" data-field="ribbon"${values.ribbon === position ? " checked" : ""} />
        ${RIBBON_LABELS[position]}
      </label>`).join("");
  return `
    <fieldset class="group">
      <legend class="group__title">Disponibilidad</legend>
      <label class="choice">
        <input type="checkbox" id="unavailable" data-field="unavailable" data-redraw${values.available ? "" : " checked"} />
        Producto no disponible
      </label>
      <p class="field__help">Sigue visible en el sitio, con una cinta sobre las fotos, el botón desactivado y dentro de la categoría "No disponible".</p>
      ${values.available ? "" : `
      <div role="radiogroup" aria-label="Posición de la cinta" class="choices">
        <p class="field__label">Posición de la cinta</p>
        ${ribbons}
      </div>
      ${errorMessage(errors, "ribbon", "ribbon")}`}
    </fieldset>`;
}

function showProductForm({ errors = [], notice = "", error = "" } = {}) {
  const { values } = state.form;
  const heading = isEditing() ? "Editar producto" : "Agregar producto";
  root.innerHTML = `
    ${panelHeader()}
    <section class="panel__card" aria-labelledby="form-title">
      <h1 id="form-title" class="panel__title">${heading}</h1>
      <form data-product-form novalidate class="panel__form">
        <p role="alert" class="panel__error">${escapeHtml(error || (errors.length > 0 ? "Revisa los campos marcados antes de continuar." : ""))}</p>
        <p role="status" class="panel__notice">${escapeHtml(notice)}</p>
        ${textField({ id: "title", label: "Título", value: values.title, errors })}
        ${categoryFields(values, errors)}
        ${textField({ id: "subcategory", label: "Subcategoría", value: values.subcategory, optional: true, help: 'Por ejemplo "2 plazas".' })}
        ${photoFields(values, errors)}
        ${badgeFields(values)}
        ${variantFields(values, errors)}
        ${availabilityFields(values, errors)}
        <div class="panel__actions">
          <button type="submit" class="button button--primary">Vista previa</button>
          <button type="button" data-cancel class="button">Cancelar</button>
        </div>
      </form>
    </section>`;

  const form = root.querySelector("[data-product-form]");
  form.addEventListener("input", handleFormInput);
  form.addEventListener("click", handleFormClick);
  form.querySelector("[data-photo-input]").addEventListener("change", (event) => addPhotos([...event.target.files]));
  // A published photo that is not on the site yet cannot be shown here.
  for (const image of form.querySelectorAll(".photo__frame img")) {
    image.addEventListener("error", () => image.replaceWith(Object.assign(document.createElement("span"), { className: "photo__missing", textContent: "Sin vista previa" })));
  }
  form.addEventListener("submit", handleFormSubmit);
  bindPhotoDropZone(form.querySelector("[data-photos]"));
  root.querySelector("[data-signout]").addEventListener("click", signOut);
}

// Copies what was typed into state.form.values. Changes that show or hide
// fields (new category, not available) redraw the form.
function handleFormInput(event) {
  const { values } = state.form;
  const control = event.target;
  const index = Number(control.dataset.index);
  // The file picker is handled by its own "change" listener.
  if ("photoInput" in control.dataset) return;

  if (control.dataset.variantField) values.variants[index][control.dataset.variantField] = control.value;
  else if (control.dataset.field === "unavailable") values.available = !control.checked;
  else if (control.dataset.field) values[control.dataset.field] = control.value;

  if (!("redraw" in control.dataset)) return;
  showProductForm();
  // Go on from where the owner was: the field that just appeared, or the same one.
  const next = control.dataset.field === "category" && values.category === NEW_CATEGORY ? "#newCategory" : `#${control.id}`;
  root.querySelector(next)?.focus();
}

function handleFormClick(event) {
  const { values } = state.form;
  const removeButton = event.target.closest("[data-remove-item]");
  const movePhotoButton = event.target.closest("[data-move-photo]");
  const removePhotoButton = event.target.closest("[data-remove-photo]");

  if (movePhotoButton || removePhotoButton) {
    const index = Number((movePhotoButton ?? removePhotoButton).dataset.index);
    if (movePhotoButton) movePhoto(index, Number(movePhotoButton.dataset.movePhoto));
    else removePhoto(index);
    state.form.photoMessage = "";
    showProductForm();
    root.querySelector("[data-photos] .file-button input")?.focus();
  } else if (removeButton) {
    values.variants.splice(Number(removeButton.dataset.index), 1);
    showProductForm();
  } else if (event.target.closest("[data-cancel]")) {
    cancelProductForm();
  }
}

async function cancelProductForm() {
  if (hasUnsavedChanges()) {
    const discard = await confirmDialog({
      title: "Descartar cambios",
      message: "Lo que escribiste en el formulario se perderá.",
      confirmLabel: "Descartar",
      cancelLabel: "Seguir editando",
      tone: "danger",
    });
    if (!discard) return;
  }
  closeProductForm();
  showCatalog();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const errors = validateProductForm(state.form.values);
  if (errors.length > 0) {
    showProductForm({ errors });
    root.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  showPreview();
}

// ---------- Photos of the form ----------
// New photos are kept in state.form.photos (key -> { base64, extension,
// previewUrl }) and referenced from values.images by their key until they are
// published.
function photoSource(image) {
  return isNewPhoto(image) ? state.form.photos[image].previewUrl : SITE_ROOT + image;
}

function photoFields(values, errors) {
  const count = values.images.length;
  const items = values.images
    .map((image, index) => `
      <li class="photo">
        <div class="photo__frame">
          <img src="${escapeHtml(photoSource(image))}" alt="Foto ${index + 1}" />
          ${index === 0 ? `<span class="photo__cover">Portada</span>` : ""}
        </div>
        <div class="photo__actions">
          <button type="button" data-move-photo="-1" data-index="${index}" aria-label="Mover la foto ${index + 1} antes"${index === 0 ? " disabled" : ""} class="button button--small">←</button>
          <button type="button" data-move-photo="1" data-index="${index}" aria-label="Mover la foto ${index + 1} después"${index === count - 1 ? " disabled" : ""} class="button button--small">→</button>
          <button type="button" data-remove-photo data-index="${index}" aria-label="Quitar la foto ${index + 1}" class="button button--small">Quitar</button>
        </div>
      </li>`)
    .join("");
  const canAdd = canAddImage(count);
  return `
    <fieldset class="group" data-photos>
      <legend class="group__title">Fotos <span class="field__optional">(opcional, ${count} de ${MAX_IMAGES})</span></legend>
      <p class="field__help">La primera es la portada. Se reducen solas antes de guardarse. Puedes arrastrar las fotos a esta sección o usar el botón.</p>
      ${count > 0 ? `<ul class="photos">${items}</ul>` : ""}
      <p role="alert" class="panel__error" data-photo-error>${escapeHtml(state.form.photoMessage)}</p>
      ${errorMessage(errors, "images", "images")}
      <label class="button button--small file-button${canAdd ? "" : " file-button--disabled"}">
        Agregar fotos
        <input type="file" accept="image/*" multiple data-photo-input${canAdd ? "" : " disabled"} class="sr-only" />
      </label>
      <p role="status" class="field__help" data-photo-status></p>
    </fieldset>`;
}

function randomSuffix() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 6);
}

// Adds the chosen files: the ones that are not pictures are named and left
// out, and so are the ones over the limit; the rest are kept.
async function addPhotos(files) {
  const { values, photos } = state.form;
  const rejected = [];
  let overLimit = 0;
  root.querySelector("[data-photo-status]").textContent = "Preparando las fotos…";
  root.querySelector("[data-photo-input]").disabled = true;

  for (const file of files) {
    if (!canAddImage(values.images.length)) {
      overLimit += 1;
      continue;
    }
    try {
      const photo = await preparePhoto(file);
      const key = newPhotoKey(randomSuffix() + randomSuffix());
      photos[key] = photo;
      values.images.push(key);
    } catch {
      rejected.push(file.name);
    }
  }

  const messages = [];
  if (rejected.length > 0) messages.push(`No se agregó ${rejected.map((name) => `"${name}"`).join(", ")}: no es una imagen que se pueda abrir.`);
  if (overLimit > 0) messages.push(`Se alcanzó el máximo de ${MAX_IMAGES} fotos; ${overLimit === 1 ? "quedó 1 sin agregar" : `quedaron ${overLimit} sin agregar`}.`);
  state.form.photoMessage = messages.join(" ");
  showProductForm();
  root.querySelector("[data-photos] .file-button")?.scrollIntoView({ block: "nearest" });
}

function removePhoto(index) {
  const { values, photos } = state.form;
  const [image] = values.images.splice(index, 1);
  if (isNewPhoto(image)) {
    URL.revokeObjectURL(photos[image].previewUrl);
    delete photos[image];
  }
}

function movePhoto(index, step) {
  const { images } = state.form.values;
  const target = index + step;
  if (target < 0 || target >= images.length) return;
  [images[index], images[target]] = [images[target], images[index]];
}

// Photos can be dropped on the photo section. The zone highlights while files
// are dragged over it; a drop anywhere else on the page must not make the
// browser open the image and lose the form.
function bindPhotoDropZone(zone) {
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragleave", (event) => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("is-dragging");
  });
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("is-dragging");
    addPhotos([...event.dataTransfer.files]);
  });
}

// Frees the previews of the photos that were not published.
function closeProductForm() {
  for (const photo of Object.values(state.form?.photos ?? {})) URL.revokeObjectURL(photo.previewUrl);
  state.form = null;
}

// ---------- Preview and publication ----------
// The preview is the real product card, so the owner sees what the visitor
// will see.
function showPreview({ error = "" } = {}) {
  const { values, photos } = state.form;
  const categorySlug = values.category === NEW_CATEGORY ? slugify(values.newCategory) : values.category;
  // The panel sits one folder below the site, so stored photos need "../".
  const images = values.images.map((image) => (isNewPhoto(image) ? photos[image].previewUrl : SITE_ROOT + image));
  const product = normalizeProduct(formToProduct({ ...values, images }, { code: "preview", category: categorySlug }));

  root.innerHTML = `
    ${panelHeader()}
    <section class="panel__card" aria-labelledby="preview-title">
      <h1 id="preview-title" class="panel__title">Vista previa</h1>
      <p class="panel__count">Así lo verá el visitante en datosonline.cl.</p>
      <p role="alert" class="panel__error">${escapeHtml(error)}</p>
      <div class="preview" data-preview></div>
      <div class="panel__actions">
        <button type="button" data-publish class="button button--primary">Publicar</button>
        <button type="button" data-edit-again class="button">Volver a editar</button>
      </div>
    </section>`;

  const card = document.createElement("product-card");
  card.product = product;
  root.querySelector("[data-preview]").append(card);
  root.querySelector("[data-signout]").addEventListener("click", signOut);
  root.querySelector("[data-publish]").addEventListener("click", publishProduct);
  root.querySelector("[data-edit-again]").addEventListener("click", () => showProductForm());
}

// Disables every button while the product is being saved.
function setPublishing(isPublishing) {
  saving = isPublishing;
  for (const button of root.querySelectorAll("button")) button.disabled = isPublishing;
  const publishButton = root.querySelector("[data-publish]");
  if (publishButton) publishButton.textContent = isPublishing ? "Publicando…" : "Publicar";
}

// Saves the product as ONE commit (data and photos). A second click while it
// is saving does nothing: the buttons are disabled.
async function publishProduct() {
  if (saving) return;
  setPublishing(true);

  const { values, photos, code: editedCode } = state.form;
  const isNew = !isEditing();
  const catalog = state.catalog;
  const title = values.title.trim();
  let next = null;
  let result = null;

  try {
    const code = isNew ? nextProductCode(catalog.products) : editedCode;
    const existing = isNew ? null : catalog.products.find((item) => item.code === code);
    if (!isNew && !existing) throw new GithubError("conflict");

    const category =
      values.category === NEW_CATEGORY
        ? resolveCategory(catalog.categories, values.newCategory)
        : { categories: catalog.categories, slug: values.category };
    const photoPlan = assignPhotoPaths(values.images, code, photos, randomSuffix);
    const product = formToProduct({ ...values, images: photoPlan.images }, { code, category: category.slug });
    const products = isNew ? addProduct(catalog.products, product) : updateProduct(catalog.products, code, product);
    next = { products, categories: category.categories };

    result = await state.client.publish({
      base: catalog,
      products,
      categories: category.categories,
      newImages: photoPlan.newImages,
      removedImages: existing ? removedImagePaths(existing, product) : [],
      message: describeChange(isNew ? "add" : "update", product),
    });
  } catch (failure) {
    setPublishing(false);
    await handlePublishFailure(failure);
    return;
  }

  // The change is already published. If the list cannot be read again, keep
  // the list just saved; the old file versions make the next save check the
  // repository first.
  try {
    state.catalog = await state.client.loadCatalog();
  } catch {
    state.catalog = { ...catalog, ...next, commitSha: result.commitSha, fileShas: {} };
  }
  saving = false;
  closeProductForm();
  showCatalog({ notice: `Se guardó "${title}". ${PUBLISHED_NOTICE}` });
}

// The owner's text stays on screen in every case, so trying again is possible.
async function handlePublishFailure(failure) {
  if (failure.code === "invalid-token" || failure.code === "no-access") {
    // The form is kept in memory and comes back after signing in again.
    clearToken();
    showSignIn(failure.message);
    return;
  }
  if (failure.code === "conflict") {
    try {
      state.catalog = await state.client.loadCatalog();
    } catch {
      // The list on screen is still the last one that could be read.
    }
  }
  showPreview({ error: failure.message });
}

// ---------- Start ----------
const savedToken = readToken();
if (savedToken) openCatalog(createClient(savedToken));
else showSignIn();
