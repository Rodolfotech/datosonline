import "./product-card.js";
import { categories } from "../data/categories.js";
import { products } from "../data/products.js";
import { escapeHtml } from "../lib/categories.js";
import { getVisibleProducts, productCountLabel } from "../lib/products.js";

// <product-grid category="tecnologia"></product-grid>
// Without `category` it shows every product.
class ProductGrid extends HTMLElement {
  static observedAttributes = ["category"];

  connectedCallback() {
    this.classList.add("block");
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const categorySlug = this.getAttribute("category") ?? "";
    const category = categories.find((item) => item.slug === categorySlug);
    const visibleProducts = getVisibleProducts(products, category ? categorySlug : "");
    const heading = category ? category.name : "Todos los productos";

    this.innerHTML = `
      <section aria-labelledby="product-grid-title" class="mx-auto max-w-6xl px-4 py-8">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="product-grid-title" class="text-2xl sm:text-3xl">${escapeHtml(heading)}</h2>
          <p class="text-sm font-bold text-navy/75">${productCountLabel(visibleProducts.length)}</p>
        </div>
        ${visibleProducts.length === 0
          ? `<p class="mt-6 rounded-2xl border-2 border-ink bg-paper p-6 text-lg">Todavía no hay productos en esta categoría. <a href="./" class="font-bold underline">Ver todos los productos</a></p>`
          : `<ul data-cards class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></ul>`}
      </section>`;

    const list = this.querySelector("[data-cards]");
    for (const product of visibleProducts) {
      const item = document.createElement("li");
      const card = document.createElement("product-card");
      card.product = product;
      item.append(card);
      list.append(item);
    }
  }
}

customElements.define("product-grid", ProductGrid);
