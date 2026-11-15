import { categories } from "../data/categories.js";
import { categoryUrl, escapeHtml, splitCategories } from "../lib/categories.js";
import { logoHtml } from "./logo.js";

// Categories shown directly in the desktop bar; the rest go under "Más".
const MAX_VISIBLE_CATEGORIES = 4;

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ground";
const PILL = `block rounded-full px-4 py-2.5 font-bold transition-colors ${FOCUS_RING}`;
const PILL_ACTIVE = `${PILL} bg-accent text-paper`;
const PILL_IDLE = `${PILL} text-gray-2 hover:bg-navy hover:text-paper`;
const ICON_BUTTON = `grid size-11 place-items-center rounded-full border border-paper/70 text-paper transition-colors hover:bg-navy ${FOCUS_RING}`;

const SEARCH_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
const MENU_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;

function categoryLink(category, activeSlug) {
  const isActive = category.slug === activeSlug;
  return `<li><a href="${categoryUrl(category.slug)}" class="${isActive ? PILL_ACTIVE : PILL_IDLE}"${isActive ? ' aria-current="page"' : ""}>${escapeHtml(category.name)}</a></li>`;
}

// <site-navbar active-category="tecnologia"></site-navbar>
class SiteNavbar extends HTMLElement {
  static observedAttributes = ["active-category"];

  connectedCallback() {
    // The host element is the sticky one: a sticky child would never leave it.
    this.classList.add("sticky", "top-0", "z-50", "block");
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
    const allCategories = [{ slug: "", name: "Todo" }, ...categories];
    const { visible, overflow } = splitCategories(categories, MAX_VISIBLE_CATEGORIES, activeSlug);
    const desktopCategories = [allCategories[0], ...visible];

    const moreMenu = overflow.length === 0 ? "" : `
      <li class="relative">
        <button type="button" data-menu-toggle aria-expanded="false" aria-controls="navbar-more-menu" class="${PILL_IDLE} cursor-pointer">Más</button>
        <ul id="navbar-more-menu" hidden class="absolute right-0 top-full mt-3 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-navy bg-ink p-2 shadow-xl">
          ${overflow.map((category) => categoryLink(category, activeSlug)).join("")}
        </ul>
      </li>`;

    this.innerHTML = `
      <header class="border-b-[3px] border-accent bg-ink text-paper">
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          ${logoHtml()}
          <div class="flex items-center gap-2 md:gap-4">
            <nav aria-label="Categorías" class="hidden md:block">
              <ul class="flex items-center gap-1">
                ${desktopCategories.map((category) => categoryLink(category, activeSlug)).join("")}
                ${moreMenu}
              </ul>
            </nav>
            <a href="/#buscador" aria-label="Buscar productos" class="${ICON_BUTTON}">${SEARCH_ICON}</a>
            <button type="button" data-menu-toggle aria-expanded="false" aria-controls="navbar-mobile-menu" aria-label="Menú de categorías" class="${ICON_BUTTON} cursor-pointer md:hidden">${MENU_ICON}</button>
          </div>
        </div>
        <nav id="navbar-mobile-menu" hidden aria-label="Categorías" class="max-h-[70vh] overflow-y-auto border-t border-navy px-4 py-3 md:hidden">
          <ul class="mx-auto grid max-w-6xl gap-1">
            ${allCategories.map((category) => categoryLink(category, activeSlug)).join("")}
          </ul>
        </nav>
      </header>`;
  }
}

customElements.define("site-navbar", SiteNavbar);
