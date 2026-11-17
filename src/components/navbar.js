import { categories } from "../data/categories.js";
import { products } from "../data/products.js";
import { categoryUrl, escapeHtml, getSiteCategories, splitCategories } from "../lib/categories.js";
import { logoHtml } from "./logo.js";

// Categories shown directly in the desktop bar; the rest go under "Más".
const MAX_VISIBLE_CATEGORIES = 4;

const MENU_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;

function categoryLink(category, activeSlug) {
  const isActive = category.slug === activeSlug;
  return `<li><a href="${categoryUrl(category.slug)}" class="pill"${isActive ? ' aria-current="page"' : ""}>${escapeHtml(category.name)}</a></li>`;
}

// <site-navbar active-category="smartphones"></site-navbar>
class SiteNavbar extends HTMLElement {
  static observedAttributes = ["active-category"];

  connectedCallback() {
    this.render();
    this.addEventListener("click", this.handleClick);
    document.addEventListener("click", this.handleOutsideClick);
    document.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick);
    document.removeEventListener("keydown", this.handleKeydown);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  handleClick = (event) => {
    const toggle = event.target.closest("[data-menu-toggle]");
    if (!toggle) return;
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    this.closeMenus();
    if (!wasOpen) this.setMenuOpen(toggle, true);
  };

  handleOutsideClick = (event) => {
    if (!this.contains(event.target)) this.closeMenus();
  };

  handleKeydown = (event) => {
    if (event.key !== "Escape") return;
    const openToggle = this.querySelector('[data-menu-toggle][aria-expanded="true"]');
    if (!openToggle) return;
    this.closeMenus();
    openToggle.focus();
  };

  setMenuOpen(toggle, isOpen) {
    toggle.setAttribute("aria-expanded", String(isOpen));
    this.querySelector(`#${toggle.getAttribute("aria-controls")}`).hidden = !isOpen;
  }

  closeMenus() {
    for (const toggle of this.querySelectorAll("[data-menu-toggle]")) {
      this.setMenuOpen(toggle, false);
    }
  }

  render() {
    const activeSlug = this.getAttribute("active-category") ?? "";
    const siteCategories = getSiteCategories(categories, products);
    const allCategories = [{ slug: "", name: "Todo" }, ...siteCategories];
    const { visible, overflow } = splitCategories(siteCategories, MAX_VISIBLE_CATEGORIES, activeSlug);
    const desktopCategories = [allCategories[0], ...visible];

    const moreMenu = overflow.length === 0 ? "" : `
      <li class="navbar__more">
        <button type="button" data-menu-toggle aria-expanded="false" aria-controls="navbar-more-menu" class="pill">Más</button>
        <ul id="navbar-more-menu" hidden class="navbar__more-menu">
          ${overflow.map((category) => categoryLink(category, activeSlug)).join("")}
        </ul>
      </li>`;

    this.innerHTML = `
      <header class="navbar">
        <div class="container navbar__bar">
          ${logoHtml()}
          <div class="navbar__actions">
            <nav aria-label="Categorías" class="navbar__desktop">
              <ul class="navbar__list">
                ${desktopCategories.map((category) => categoryLink(category, activeSlug)).join("")}
                ${moreMenu}
                <li><a href="./guias/" class="pill">Guías</a></li>
              </ul>
            </nav>
            <button type="button" data-menu-toggle aria-expanded="false" aria-controls="navbar-mobile-menu" aria-label="Menú de categorías" class="icon-button navbar__menu-toggle">${MENU_ICON}</button>
          </div>
        </div>
        <nav id="navbar-mobile-menu" hidden aria-label="Categorías" class="navbar__mobile">
          <ul class="navbar__mobile-list">
            ${allCategories.map((category) => categoryLink(category, activeSlug)).join("")}
            <li><a href="./guias/" class="pill">Guías</a></li>
          </ul>
        </nav>
      </header>`;
  }
}

customElements.define("site-navbar", SiteNavbar);
