import { categories } from "../data/categories.js";
import { site } from "../data/site.js";
import { categoryUrl, escapeHtml } from "../lib/categories.js";
import { logoHtml } from "./logo.js";

// The footer lists only the first categories so it stays short as they grow.
const MAX_FOOTER_CATEGORIES = 8;

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ground";
const FOOTER_LINK = `rounded font-semibold text-gray-2 transition-colors hover:text-paper ${FOCUS_RING}`;

const INSTAGRAM_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/></svg>`;

// <site-footer></site-footer>
class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.classList.add("block");
    const footerCategories = [{ slug: "", name: "Todo" }, ...categories.slice(0, MAX_FOOTER_CATEGORIES)];
    const year = new Date().getFullYear();

    this.innerHTML = `
      <footer class="border-t-[3px] border-accent bg-ink text-gray-2">
        <div class="mx-auto max-w-6xl px-4 pt-10 pb-6">
          <div class="grid gap-10 md:grid-cols-[4fr_3fr_4fr]">
            <div>
              ${logoHtml()}
              <p class="mt-4 max-w-sm">Reviso productos, te cuento lo importante en 30 segundos y te dejo el enlace directo para que veas el precio actualizado.</p>
              <a href="${escapeHtml(site.instagramUrl)}" target="_blank" rel="noopener noreferrer" class="mt-5 inline-flex items-center gap-2.5 rounded-full bg-paper px-5 py-3 font-bold text-ink transition-colors hover:bg-gray-2 ${FOCUS_RING}">
                ${INSTAGRAM_ICON} Sígueme en Instagram
              </a>
            </div>
            <nav aria-label="Categorías del pie de página">
              <h2 class="text-base text-paper">Categorías</h2>
              <ul class="mt-3 grid gap-1">
                ${footerCategories.map((category) => `<li><a href="${categoryUrl(category.slug)}" class="inline-block py-1.5 ${FOOTER_LINK}">${escapeHtml(category.name)}</a></li>`).join("")}
              </ul>
            </nav>
            <div>
              <h2 class="text-base text-paper">Transparencia</h2>
              <p class="mt-3 text-sm leading-relaxed">DatosOnline participa en el Programa de Afiliados de Mercado Libre. Si compras desde un enlace de esta web, puedo recibir una pequeña comisión <strong class="text-paper">sin costo extra para ti</strong>. El precio, stock, envío y garantía los define cada vendedor en Mercado Libre.</p>
            </div>
          </div>
          <div class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-navy pt-6 text-sm">
            <p>© ${year} ${escapeHtml(site.domain)}</p>
            <a href="#top" class="py-1.5 ${FOOTER_LINK}">Volver arriba <span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </footer>`;
  }
}

customElements.define("site-footer", SiteFooter);
