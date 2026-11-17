import { escapeHtml } from "../lib/categories.js";
import { ELLIPSIS, clampPage, pageNumbers } from "../lib/pagination.js";

const PREVIOUS_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>`;
const NEXT_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>`;

// Reusable pager. Only shows the page buttons; the page itself is decided by
// whoever uses it.
//
//   <site-pager pages="3" current="1"></site-pager>
//
// Shows nothing when there is a single page. When the visitor picks another
// page it fires a bubbling "pagechange" event with detail { page }.
// Styles live in src/style.css under "Paginador".
class SitePager extends HTMLElement {
  static observedAttributes = ["pages", "current"];

  connectedCallback() {
    this.addEventListener("click", this.handleClick);
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get pages() {
    return Math.max(1, Math.floor(Number(this.getAttribute("pages"))) || 1);
  }

  get current() {
    return clampPage(this.getAttribute("current") ?? 1, this.pages);
  }

  handleClick = (event) => {
    const button = event.target.closest("[data-page]");
    if (!button || button.disabled) return;
    this.dispatchEvent(new CustomEvent("pagechange", { bubbles: true, detail: { page: Number(button.dataset.page) } }));
  };

  render() {
    const { pages, current } = { pages: this.pages, current: this.current };
    if (pages <= 1) {
      this.innerHTML = "";
      return;
    }

    const numbers = pageNumbers(current, pages)
      .map((item) =>
        item === ELLIPSIS
          ? `<span aria-hidden="true" class="pager__gap">${ELLIPSIS}</span>`
          : `<button type="button" data-page="${item}" aria-label="Página ${item}"${item === current ? ' aria-current="page"' : ""} class="pager__page">${item}</button>`,
      )
      .join("");

    this.innerHTML = `
      <nav aria-label="Páginas" class="pager">
        <button type="button" data-page="${current - 1}" aria-label="Página anterior"${current === 1 ? " disabled" : ""} class="pager__button">${PREVIOUS_ICON}<span>Anterior</span></button>
        <div class="pager__pages">${numbers}</div>
        <button type="button" data-page="${current + 1}" aria-label="Página siguiente"${current === pages ? " disabled" : ""} class="pager__button"><span>Siguiente</span>${NEXT_ICON}</button>
      </nav>`;
  }
}

customElements.define("site-pager", SitePager);
