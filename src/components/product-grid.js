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
      <section aria-labelledby="product-grid-title" class="container products">
        <div class="products__header">
          <h2 id="product-grid-title" class="products__title">${escapeHtml(heading)}</h2>
          <p class="products__count">${productCountLabel(visibleProducts.length)}</p>
        </div>
        ${visibleProducts.length === 0
          ? `<p class="products__empty">Todavía no hay productos en esta categoría. <a href="./">Ver todos los productos</a></p>`
          : `<ul data-cards class="products__list"></ul>`}
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
