import "./product-card.js";
import { categories } from "../data/categories.js";
import { products } from "../data/products.js";
import { escapeHtml, getSiteCategories } from "../lib/categories.js";
import { getCards, productCountLabel } from "../lib/products.js";

// <product-grid category="smartphones"></product-grid>
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
    const category = getSiteCategories(categories, products).find((item) => item.slug === categorySlug);
    const visibleProducts = getCards(products, category ? categorySlug : "");
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
    this.scrollToLinkedCard();
  }

  // A link such as datosonline.cl/#iphone-17-pro-max-512-gb opens the page at
  // that product's card.
  scrollToLinkedCard() {
    const cardId = decodeURIComponent(window.location.hash.slice(1));
    if (!cardId) return;
    document.getElementById(cardId)?.scrollIntoView({ block: "center" });
  }
}

customElements.define("product-grid", ProductGrid);
