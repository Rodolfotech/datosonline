import "./popover.js";
import { categories } from "../data/categories.js";
import { escapeHtml } from "../lib/categories.js";

const SHARE_FEEDBACK_MS = 2500;
const AFFILIATE_NOTICE_TEXT = "Te llevamos a Mercado Libre. Si compras dentro de las 24 horas desde que entras por este enlace, DatosOnline recibe una comisión sin costo extra para ti.";
const INFO_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon icon--small" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><circle cx="12" cy="12" r="9.25"/><path d="M12 11v5.5M12 7.5h.01"/></svg>`;
const PRICE_LABEL = "Ver precio en Mercado Libre";

const EXTERNAL_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon icon--small" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
const SHARE_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.7M8.2 13.2l7.6 3.7"/></svg>`;
const CHEVRON_LEFT_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>`;
const CHEVRON_RIGHT_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>`;
const PLACEHOLDER_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="card__placeholder" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5.5-5 3.5 3 2.5-2 4.5 4"/></svg>`;

function categoryName(slug) {
  return categories.find((category) => category.slug === slug)?.name ?? "";
}

// Usage: const card = document.createElement("product-card"); card.product = product;
// `product` must come from getCards() in lib/products.js: one version per card.
class ProductCard extends HTMLElement {
  #product = null;

  set product(product) {
    this.#product = product;
    if (this.isConnected) this.render();
  }

  get product() {
    return this.#product;
  }

  // The affiliate link and the version name of this card.
  get link() {
    return this.#product.variants[0];
  }

  connectedCallback() {
    this.addEventListener("click", this.handleClick);
    // A broken photo falls back to the placeholder instead of a broken image.
    this.addEventListener("error", this.handleImageError, true);
    if (this.#product) this.render();
  }

  handleClick = (event) => {
    if (event.target.closest("[data-share]")) this.share();
    const galleryButton = event.target.closest("[data-gallery-step]");
    if (galleryButton) this.stepGallery(Number(galleryButton.dataset.galleryStep));
  };

  // "iPhone 17 Pro Max • 512 GB", or only the title when there is no version.
  displayTitle() {
    return [this.#product.title, this.link.label].filter(Boolean).join(" • ");
  }

  priceAriaLabel() {
    return `${PRICE_LABEL}: ${this.displayTitle()} (se abre en una pestaña nueva)`;
  }

  // Moves one photo back (-1) or forward (1); swiping the photos also works.
  stepGallery(step) {
    const gallery = this.querySelector("[data-gallery]");
    gallery.scrollBy({ left: step * gallery.clientWidth });
  }

  updateGalleryCounter = () => {
    const gallery = this.querySelector("[data-gallery]");
    const current = Math.round(gallery.scrollLeft / gallery.clientWidth) + 1;
    this.querySelector("[data-gallery-counter]").textContent = `${current} / ${this.#product.images.length}`;
  };

  handleImageError = (event) => {
    if (event.target.matches("img")) event.target.outerHTML = PLACEHOLDER_ICON;
  };

  async share() {
    const { url } = this.link;
    const title = this.displayTitle();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.showShareStatus("Enlace copiado");
    } catch (error) {
      // The visitor closing the share sheet is not an error.
      if (error.name !== "AbortError") this.showShareStatus("No se pudo compartir");
    }
  }

  showShareStatus(message) {
    const status = this.querySelector("[data-share-status]");
    status.textContent = message;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      status.textContent = "";
    }, SHARE_FEEDBACK_MS);
  }

  render() {
    const { code, category, subcategory, badge, images, available, ribbon, cardId } = this.#product;
    const safeTitle = escapeHtml(this.displayTitle());
    const meta = [categoryName(category), subcategory].filter(Boolean).map(escapeHtml).join(' <span aria-hidden="true">·</span> ');
    // The affiliate notice is an icon beside the category: it shows on hover,
    // focus or tap, so the card does not carry extra text.
    const infoHtml = available
      ? `<info-popover text="${escapeHtml(AFFILIATE_NOTICE_TEXT)}">
            <button type="button" aria-label="Información sobre la comisión de DatosOnline" class="card__info">${INFO_ICON}</button>
          </info-popover>`
      : "";

    const hasGallery = images.length > 1;
    const photoAlt = (index) => (hasGallery ? `${safeTitle}, foto ${index + 1} de ${images.length}` : safeTitle);
    const media = images.length === 0 ? PLACEHOLDER_ICON : `
      <ul data-gallery class="card__gallery${hasGallery ? " card__gallery--multiple" : ""}">
        ${images.map((image, index) => `<li class="card__slide"><img src="${escapeHtml(image)}" alt="${photoAlt(index)}" loading="lazy" decoding="async" class="card__photo" /></li>`).join("")}
      </ul>`;
    const galleryControls = !hasGallery ? "" : `
      <button type="button" data-gallery-step="-1" aria-label="Foto anterior de ${safeTitle}" class="card__arrow card__arrow--previous">${CHEVRON_LEFT_ICON}</button>
      <button type="button" data-gallery-step="1" aria-label="Foto siguiente de ${safeTitle}" class="card__arrow card__arrow--next">${CHEVRON_RIGHT_ICON}</button>
      <span data-gallery-counter aria-hidden="true" class="card__counter">1 / ${images.length}</span>`;

    // Tape over the photos of a product that is not available. It sits outside
    // the gallery, so it stays in place on every photo.
    const ribbonHtml = available ? "" : `
      <div class="card__ribbon-area">
        <p class="ribbon ribbon--${ribbon}"><span class="ribbon__text">No disponible</span></p>
      </div>`;

    const badgeHtml = badge ? `<span class="badge badge--${badge.tone}">${escapeHtml(badge.label)}</span>` : "";

    // An unavailable product keeps its place on the site but none of its
    // controls opens Mercado Libre: its links may no longer work.
    const priceHtml = available ? `
            <a data-price-link href="${escapeHtml(this.link.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="${escapeHtml(this.priceAriaLabel())}" class="card__price">
              <span data-price-label>${PRICE_LABEL}</span> ${EXTERNAL_ICON}
            </a>` : `
            <button type="button" disabled aria-label="${safeTitle} no está disponible" class="card__price">No disponible</button>`;

    this.innerHTML = `
      <article class="card" id="${escapeHtml(cardId)}">
        <div class="card__media">
          ${media}
          ${ribbonHtml}
          ${galleryControls}
          <div class="card__tags">${badgeHtml}</div>
        </div>
        <div class="card__body">
          <p class="card__code">Código <strong>${escapeHtml(code)}</strong></p>
          <div class="card__meta-row">
            <p class="card__meta">${meta}</p>
            ${infoHtml}
          </div>
          <h3 class="card__title">${safeTitle}</h3>
          <div class="card__actions">
            ${priceHtml}
            <button type="button" data-share aria-label="Compartir ${safeTitle}"${available ? "" : " disabled"} class="card__share">${SHARE_ICON}</button>
          </div>
          <p data-share-status role="status" class="card__status"></p>
        </div>
      </article>`;

    if (hasGallery) {
      this.querySelector("[data-gallery]").addEventListener("scroll", this.updateGalleryCounter, { passive: true });
    }
  }
}

customElements.define("product-card", ProductCard);
