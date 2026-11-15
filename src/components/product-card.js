import "./popover.js";
import { categories } from "../data/categories.js";
import { escapeHtml } from "../lib/categories.js";

const SHARE_FEEDBACK_MS = 2500;
const PRICE_POPOVER_TEXT = "Al presionar el botón serás redirigido para ver el producto en Mercado Libre.";

const EXTERNAL_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon icon--small" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
const SHARE_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.7M8.2 13.2l7.6 3.7"/></svg>`;
const CHEVRON_LEFT_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>`;
const CHEVRON_DOWN_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon icon--small" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 9 7 7 7-7"/></svg>`;
const CHEVRON_RIGHT_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>`;
const PLACEHOLDER_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="card__placeholder" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5.5-5 3.5 3 2.5-2 4.5 4"/></svg>`;

function categoryName(slug) {
  return categories.find((category) => category.slug === slug)?.name ?? "";
}

// Usage: const card = document.createElement("product-card"); card.product = product;
// `product` must come from getVisibleProducts() in lib/products.js.
class ProductCard extends HTMLElement {
  #product = null;
  #variantIndex = 0;

  set product(product) {
    this.#product = product;
    this.#variantIndex = 0;
    if (this.isConnected) this.render();
  }

  get product() {
    return this.#product;
  }

  connectedCallback() {
    this.addEventListener("click", this.handleClick);
    // A broken photo falls back to the placeholder instead of a broken image.
    this.addEventListener("error", this.handleImageError, true);
    if (this.#product) this.render();
  }

  handleClick = (event) => {
    if (event.target.closest("[data-share]")) this.share();
    const detailsToggle = event.target.closest("[data-details-toggle]");
    if (detailsToggle) this.toggleDetails(detailsToggle);
    const variantButton = event.target.closest("[data-variant]");
    if (variantButton) this.selectVariant(Number(variantButton.dataset.variant));
    const galleryButton = event.target.closest("[data-gallery-step]");
    if (galleryButton) this.stepGallery(Number(galleryButton.dataset.galleryStep));
  };

  // A click keeps the features open (or closes them again); needed on phones
  // and with the keyboard, where there is no pointer to hover with.
  toggleDetails(toggle) {
    const isOpen = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  get selectedVariant() {
    return this.#product.variants[this.#variantIndex];
  }

  // "Ver precio 512 GB" when the product has versions, "Ver precio" otherwise.
  priceLabel() {
    return ["Ver precio", this.selectedVariant.label].filter(Boolean).join(" ");
  }

  // Points "Ver precio" to the chosen version without redrawing the card.
  selectVariant(index) {
    this.#variantIndex = index;
    for (const button of this.querySelectorAll("[data-variant]")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.variant) === index));
    }
    const link = this.querySelector("[data-price-link]");
    link.href = this.selectedVariant.url;
    link.setAttribute("aria-label", this.priceAriaLabel());
    link.querySelector("[data-price-label]").textContent = this.priceLabel();
  }

  priceAriaLabel() {
    const name = [this.#product.title, this.selectedVariant.label].filter(Boolean).join(" ");
    return `Ver precio de ${name} en Mercado Libre (se abre en una pestaña nueva)`;
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
    const { url, label } = this.selectedVariant;
    const title = [this.#product.title, label].filter(Boolean).join(" ");
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
    const { code, title, category, subcategory, features, badge, images, variants } = this.#product;
    const safeTitle = escapeHtml(title);
    const meta = [categoryName(category), subcategory].filter(Boolean).map(escapeHtml).join(' <span aria-hidden="true">·</span> ');

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

    const badgeHtml = badge
      ? `<span class="badge badge--${badge.tone}">${escapeHtml(badge.label)}</span>`
      : "";

    // The features start collapsed; they open while the pointer is over them
    // and stay open after a click on the toggle (see "Características" in CSS).
    const featuresId = `features-${code}`;
    const featuresHtml = features.length === 0 ? "" : `
      <div class="card__details">
        <button type="button" data-details-toggle aria-expanded="false" aria-controls="${escapeHtml(featuresId)}" class="card__details-toggle">
          Ver características ${CHEVRON_DOWN_ICON}
        </button>
        <div class="card__details-panel">
          <ul id="${escapeHtml(featuresId)}" class="card__features">
            ${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
          </ul>
        </div>
      </div>`;

    // Shown whenever the versions are named, even if there is only one, so the
    // visitor knows which version the link opens.
    const variantsHtml = !variants[0].label ? "" : `
      <div role="group" aria-label="Elige la versión de ${safeTitle}" class="card__variants">
        <p class="card__variants-label">Elige la versión</p>
        <div class="card__variants-list">
          ${variants.map((variant, index) => `<button type="button" data-variant="${index}" aria-pressed="${index === this.#variantIndex}" class="variant">${escapeHtml(variant.label)}</button>`).join("")}
        </div>
      </div>`;

    this.innerHTML = `
      <article class="card">
        <div class="card__media">
          ${media}
          ${galleryControls}
          <div class="card__tags">
            ${badgeHtml}
            <span class="card__code"><span class="sr-only">Código </span>${escapeHtml(code)}</span>
          </div>
        </div>
        <div class="card__body">
          <p class="card__meta">${meta}</p>
          <h3 class="card__title">${safeTitle}</h3>
          ${featuresHtml}
          ${variantsHtml}
          <div class="card__actions">
            <info-popover text="${PRICE_POPOVER_TEXT}">
              <a data-price-link href="${escapeHtml(this.selectedVariant.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="${escapeHtml(this.priceAriaLabel())}" class="card__price">
                <span data-price-label>${escapeHtml(this.priceLabel())}</span> ${EXTERNAL_ICON}
              </a>
            </info-popover>
            <button type="button" data-share aria-label="Compartir ${safeTitle}" class="card__share">${SHARE_ICON}</button>
          </div>
          <p class="card__note">Se abre en Mercado Libre · cuotas y envío según vendedor</p>
          <p data-share-status role="status" class="card__status"></p>
        </div>
      </article>`;

    if (hasGallery) {
      this.querySelector("[data-gallery]").addEventListener("scroll", this.updateGalleryCounter, { passive: true });
    }
  }
}

customElements.define("product-card", ProductCard);
