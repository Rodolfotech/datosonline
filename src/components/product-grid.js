import "./pager.js";
import "./product-card.js";
import { categories } from "../data/categories.js";
import { products } from "../data/products.js";
import { escapeHtml, getSiteCategories } from "../lib/categories.js";
import { clampPage, pageSlice } from "../lib/pagination.js";
import { getCards, productCountLabel } from "../lib/products.js";
import { searchCards } from "../lib/search.js";

// Cards per page. The page is kept in the address as ?pagina=2.
const PAGE_SIZE = 12;
// Waiting time after the last key before the list is searched again.
const SEARCH_DELAY_MS = 250;

// <product-grid category="smartphones"></product-grid>
// Without `category` it shows every product. A search (?buscar=...) looks in
// every category, by name or by code.
class ProductGrid extends HTMLElement {
  static observedAttributes = ["category"];
  #searchTimer = null;

  constructor() {
    super();
    this.addEventListener("pagechange", this.handlePageChange);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const address = new URLSearchParams(window.location.search);
    const query = (address.get("buscar") ?? "").trim();
    const siteCategories = getSiteCategories(categories, products);
    const category = siteCategories.find((item) => item.slug === this.getAttribute("category"));
    const categoryName = (slug) => siteCategories.find((item) => item.slug === slug)?.name ?? "";

    // A search looks in every category, so the category of the page is ignored.
    const scope = query || !category ? "" : category.slug;
    const allCards = getCards(products, scope);
    const cards = query ? searchCards(allCards, query, categoryName) : allCards;
    const { items, page, pages } = pageSlice(cards, clampPage(address.get("pagina") ?? 1, Infinity), PAGE_SIZE);
    const heading = query ? `Resultados para «${query}»` : category ? category.name : "Todos los productos";

    // Redrawing replaces the search field: keep the focus and the cursor when
    // the visitor is typing in it.
    const input = this.querySelector("#buscar-input");
    const hadFocus = document.activeElement === input;
    const cursor = hadFocus ? input.selectionStart : null;

    const emptyText = query
      ? `El nombre «${escapeHtml(query)}» no existe en el catálogo. Revisa cómo está escrito o busca por código, por ejemplo A-000001.`
      : "Todavía no hay productos en esta categoría.";

    this.innerHTML = `
      <section aria-labelledby="product-grid-title" class="container products">
        <form id="buscador" role="search" class="search">
          <label for="buscar-input" class="search__label">Buscar por nombre o código</label>
          <div class="search__row">
            <input id="buscar-input" type="search" value="${escapeHtml(query)}" placeholder="Ej.: iPhone 512 GB o A-000001" autocomplete="off" class="search__input" />
            <button type="submit" class="search__button">Buscar</button>
          </div>
        </form>
        <div class="products__header">
          <h2 id="product-grid-title" class="products__title">${escapeHtml(heading)}</h2>
          <p class="products__count">${productCountLabel(cards.length)}</p>
        </div>
        ${cards.length === 0
          ? `<p class="products__empty">${emptyText} <a href="./">Ver todos los productos</a></p>`
          : `<ul data-cards class="products__list"></ul>
             <site-pager pages="${pages}" current="${page}"></site-pager>`}
      </section>`;

    const list = this.querySelector("[data-cards]");
    for (const product of items) {
      const item = document.createElement("li");
      const card = document.createElement("product-card");
      card.product = product;
      item.append(card);
      list.append(item);
    }

    this.bindSearch();
    if (hadFocus) {
      const field = this.querySelector("#buscar-input");
      field.focus();
      const position = Math.min(cursor, field.value.length);
      field.setSelectionRange(position, position);
    } else {
      this.scrollToLinkedCard();
    }
  }

  bindSearch() {
    const form = this.querySelector("#buscador");
    const input = this.querySelector("#buscar-input");
    input.addEventListener("input", () => {
      clearTimeout(this.#searchTimer);
      this.#searchTimer = setTimeout(() => this.applySearch(input.value), SEARCH_DELAY_MS);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearTimeout(this.#searchTimer);
      this.applySearch(input.value);
    });
  }

  // Puts the search in the address (?buscar=...) so it can be shared, and
  // shows the first page of the results.
  applySearch(text) {
    const address = new URL(window.location.href);
    const query = text.trim();
    if (query) address.searchParams.set("buscar", query);
    else address.searchParams.delete("buscar");
    address.searchParams.delete("pagina");
    window.history.replaceState(null, "", address);
    this.render();
  }

  // Changes the page without reloading and keeps the category in the address.
  handlePageChange = (event) => {
    const address = new URL(window.location.href);
    if (event.detail.page === 1) address.searchParams.delete("pagina");
    else address.searchParams.set("pagina", String(event.detail.page));
    window.history.replaceState(null, "", address);
    this.render();
    this.querySelector(".products__header")?.scrollIntoView({ block: "start" });
  };

  // A link such as datosonline.cl/#iphone-17-pro-max-512-gb opens the page at
  // that product's card. The search icon of the menu (#buscador) opens the
  // page at the search field and puts the cursor in it.
  scrollToLinkedCard() {
    const target = decodeURIComponent(window.location.hash.slice(1));
    if (!target) return;
    if (target === "buscador") {
      const field = this.querySelector("#buscar-input");
      field?.scrollIntoView({ block: "center" });
      field?.focus();
      return;
    }
    document.getElementById(target)?.scrollIntoView({ block: "center" });
  }
}

customElements.define("product-grid", ProductGrid);
