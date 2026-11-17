import { site } from "../data/site.js";
import { escapeHtml } from "../lib/categories.js";
import { logoHtml } from "./logo.js";

const FACEBOOK_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="currentColor"><path d="M12 2a10 10 0 0 0-1.56 19.88v-7.02H7.9V12h2.54V9.8c0-2.5 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.86h-2.34v7.02A10 10 0 0 0 12 2z"/></svg>`;
const YOUTUBE_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="currentColor"><path d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.8 4.7 12 4.7 12 4.7s-6.8 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 4.8 2.8 2.8 0 0 0 2 2c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-4.8zM9.8 15.2V8.8L15.5 12z"/></svg>`;
const SHIELD_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="footer__shield" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>`;
const INSTAGRAM_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/></svg>`;

// The social networks with an address, in the order of the footer.
function socialLinksHtml() {
  const networks = [
    { url: site.instagramUrl, label: "Instagram", icon: INSTAGRAM_ICON },
    { url: site.youtubeUrl, label: "YouTube", icon: YOUTUBE_ICON },
    { url: site.facebookUrl, label: "Facebook", icon: FACEBOOK_ICON },
  ].filter((network) => network.url);
  return `
    <div class="footer__social-block">
      <ul class="footer__social">
        ${networks.map((network) => `
          <li><a href="${escapeHtml(network.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(network.label)}" class="footer__social-link">${network.icon}</a></li>`).join("")}
      </ul>
      <p class="footer__social-text">Reseñas nuevas cada semana en redes</p>
    </div>`;
}

// <site-footer></site-footer>
class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();

    this.innerHTML = `
      <footer class="footer">
        <div class="container footer__inner">
          <div class="footer__columns">
            <div>
              ${logoHtml()}
              <p class="footer__about">Reviso productos, te cuento lo importante en 30 segundos y te dejo el enlace directo para que veas el precio actualizado.</p>
              ${socialLinksHtml()}
            </div>
            <section aria-labelledby="footer-transparency" class="footer__panel">
              <h2 id="footer-transparency" class="footer__panel-title">${SHIELD_ICON} Transparencia</h2>
              <p class="footer__disclosure">DatosOnline participa en el Programa de Afiliados de Mercado Libre. Si entras por alguno de nuestros enlaces y compras dentro de las siguientes 24 horas, recibimos una pequeña comisión <strong>sin costo extra para ti</strong>, lo que nos permite seguir creando reseñas independientes.</p>
              <p class="footer__panel-note">El precio, stock, envío y garantía son responsabilidad de cada vendedor en Mercado Libre.</p>
            </section>
          </div>
          <div class="footer__bottom">
            <p>© ${year} ${escapeHtml(site.domain)}</p>
          </div>
        </div>
      </footer>`;
  }
}

customElements.define("site-footer", SiteFooter);
