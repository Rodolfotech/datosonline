import { categories } from "../data/categories.js";
import { escapeHtml } from "../lib/categories.js";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const SHARE_FEEDBACK_MS = 2500;

// Text is ink on the light tones and paper on violet, to keep it readable.
const BADGE_TONE_CLASSES = {
  top: "bg-c-yellow text-ink",
  hot: "bg-accent text-ink",
  new: "bg-c-green text-ink",
  value: "bg-c-violet text-paper",
};

const EXTERNAL_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
const SHARE_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.7M8.2 13.2l7.6 3.7"/></svg>`;
const CHEVRON_LEFT_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>`;
const CHEVRON_RIGHT_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>`;
const GALLERY_BUTTON = `absolute top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-2 border-ink bg-paper text-ink transition-colors hover:bg-gray-1 ${FOCUS_RING}`;
const VARIANT_BUTTON = `min-h-11 cursor-pointer rounded-full border-2 border-ink px-4 text-[15px] font-bold transition-colors aria-pressed:bg-ink aria-pressed:text-paper not-aria-pressed:bg-paper not-aria-pressed:hover:bg-gray-1 ${FOCUS_RING}`;
const PLACEHOLDER_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-20 text-gray-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5.5-5 3.5 3 2.5-2 4.5 4"/></svg>`;

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
    this.classList.add("block", "h-full");
    this.addEventListener("click", this.handleClick);
    // A broken photo falls back to the placeholder instead of a broken image.
    this.addEventListener("error", this.handleImageError, true);
    if (this.#product) this.render();
  }

  handleClick = (event) => {
    if (event.target.closest("[data-share]")) this.share();
    const variantButton = event.target.closest("[data-variant]");
    if (variantButton) this.selectVariant(Number(variantButton.dataset.variant));
    const galleryButton = event.target.closest("[data-gallery-step]");
    if (galleryButton) this.stepGallery(Number(galleryButton.dataset.galleryStep));
  };

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
    // Leaves room for the badges on top and, in a gallery, the arrows and counter.
    const photoPadding = hasGallery ? "px-11 pb-9" : "px-4 pb-4";
    const media = images.length === 0 ? PLACEHOLDER_ICON : `
      <ul data-gallery class="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto">
        ${images.map((image, index) => `<li class="relative size-full shrink-0 snap-center"><img src="${escapeHtml(image)}" alt="${photoAlt(index)}" loading="lazy" decoding="async" class="absolute inset-0 size-full object-contain pt-12 ${photoPadding}" /></li>`).join("")}
      </ul>`;
    const galleryControls = !hasGallery ? "" : `
      <button type="button" data-gallery-step="-1" aria-label="Foto anterior de ${safeTitle}" class="${GALLERY_BUTTON} left-2">${CHEVRON_LEFT_ICON}</button>
      <button type="button" data-gallery-step="1" aria-label="Foto siguiente de ${safeTitle}" class="${GALLERY_BUTTON} right-2">${CHEVRON_RIGHT_ICON}</button>
      <span data-gallery-counter aria-hidden="true" class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-paper">1 / ${images.length}</span>`;

    const badgeHtml = badge
      ? `<span class="rounded-full border-2 border-ink px-2.5 py-1 ${BADGE_TONE_CLASSES[badge.tone]}">${escapeHtml(badge.label)}</span>`
      : "<span></span>";

    const featuresHtml = features.length === 0 ? "" : `
      <ul class="mt-3 grid gap-1.5 text-[15px] leading-snug">
        ${features.map((feature) => `<li class="flex gap-2.5"><span aria-hidden="true" class="mt-1.5 size-2 shrink-0 rotate-45 bg-accent"></span>${escapeHtml(feature)}</li>`).join("")}
      </ul>`;

    const variantsHtml = variants.length < 2 ? "" : `
      <div role="group" aria-label="Elige la versión de ${safeTitle}" class="mt-4">
        <p class="text-sm font-bold text-navy/75">Elige la versión</p>
        <div class="mt-1.5 flex flex-wrap gap-2">
          ${variants.map((variant, index) => `<button type="button" data-variant="${index}" aria-pressed="${index === this.#variantIndex}" class="${VARIANT_BUTTON}">${escapeHtml(variant.label)}</button>`).join("")}
        </div>
      </div>`;

    this.innerHTML = `
      <article class="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]">
        <div class="relative grid aspect-square place-items-center border-b-2 border-ink bg-paper">
          ${media}
          ${galleryControls}
          <div class="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 text-xs font-extrabold uppercase tracking-wide">
            ${badgeHtml}
            <span class="shrink-0 rounded-lg bg-ink px-2.5 py-1.5 whitespace-nowrap text-paper"><span class="sr-only">Código </span>${escapeHtml(code)}</span>
          </div>
        </div>
        <div class="flex flex-1 flex-col p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-navy/75">${meta}</p>
          <h3 class="mt-2 line-clamp-3 font-body text-lg leading-snug font-extrabold">${safeTitle}</h3>
          ${featuresHtml}
          ${variantsHtml}
          <div class="mt-auto flex gap-2 pt-5">
            <a data-price-link href="${escapeHtml(this.selectedVariant.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="${escapeHtml(this.priceAriaLabel())}" class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-accent text-base font-extrabold text-ink transition-colors hover:bg-accent-2 ${FOCUS_RING}">
              <span data-price-label>${escapeHtml(this.priceLabel())}</span> ${EXTERNAL_ICON}
            </a>
            <button type="button" data-share aria-label="Compartir ${safeTitle}" class="grid size-12 shrink-0 cursor-pointer place-items-center rounded-xl border-2 border-ink bg-paper text-ink transition-colors hover:bg-gray-1 ${FOCUS_RING}">${SHARE_ICON}</button>
          </div>
          <p class="mt-2.5 text-center text-[13px] leading-snug text-navy/80">Se abre en Mercado Libre · cuotas y envío según vendedor</p>
          <p data-share-status role="status" class="text-center text-sm font-bold text-ink empty:hidden"></p>
        </div>
      </article>`;

    if (hasGallery) {
      this.querySelector("[data-gallery]").addEventListener("scroll", this.updateGalleryCounter, { passive: true });
    }
  }
}

customElements.define("product-card", ProductCard);
