import { categories } from "../data/categories.js";
import { products } from "../data/products.js";
import { site } from "../data/site.js";
import { categoryUrl, escapeHtml, getSiteCategories } from "../lib/categories.js";
import { logoHtml } from "./logo.js";

// The footer lists only the first categories so it stays short as they grow.
const MAX_FOOTER_CATEGORIES = 8;

const INSTAGRAM_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/></svg>`;

// <site-footer></site-footer>
class SiteFooter extends HTMLElement {
  connectedCallback() {
    // "No disponible" goes last and is not counted in the limit.
    const listedCategories = getSiteCategories(categories.slice(0, MAX_FOOTER_CATEGORIES), products);
    const footerCategories = [{ slug: "", name: "Todo" }, ...listedCategories];
    const year = new Date().getFullYear();

    this.innerHTML = `
      <footer class="footer">
        <div class="container footer__inner">
          <div class="footer__columns">
            <div>
              ${logoHtml()}
              <p class="footer__about">Reviso productos, te cuento lo importante en 30 segundos y te dejo el enlace directo para que veas el precio actualizado.</p>
              <a href="${escapeHtml(site.instagramUrl)}" target="_blank" rel="noopener noreferrer" class="footer__instagram">
                ${INSTAGRAM_ICON} Sígueme en Instagram
              </a>
            </div>
            <nav aria-label="Categorías del pie de página">
              <h2 class="footer__title">Categorías</h2>
              <ul class="footer__list">
                ${footerCategories.map((category) => `<li><a href="${categoryUrl(category.slug)}" class="footer__link">${escapeHtml(category.name)}</a></li>`).join("")}
              </ul>
            </nav>
            <div>
              <h2 class="footer__title">Transparencia</h2>
              <p class="footer__disclosure">DatosOnline participa en el Programa de Afiliados de Mercado Libre. Si compras desde un enlace de esta web, puedo recibir una pequeña comisión <strong>sin costo extra para ti</strong>. Si compras dentro de las 24 horas desde que entras por el enlace, la comisión es para DatosOnline. El precio, stock, envío y garantía los define cada vendedor en Mercado Libre.</p>
            </div>
          </div>
          <div class="footer__bottom">
            <p>© ${year} ${escapeHtml(site.domain)}</p>
            <a href="#top" class="footer__link">Volver arriba <span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </footer>`;
  }
}

customElements.define("site-footer", SiteFooter);
