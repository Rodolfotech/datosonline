// Banner of choice for cookies. It asks once, with "Aceptar" and "Rechazar"
// given the same weight, and closes after any choice.
import { escapeHtml } from "../lib/categories.js";

export function renderCookieBanner({ onAccept, onReject }) {
  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-labelledby", "cookie-banner-title");
  banner.innerHTML = `
    <div class="container cookie-banner__inner">
      <p id="cookie-banner-title" class="cookie-banner__text">
        Usamos cookies de medición (Microsoft Clarity y Google Tag Manager) para entender cómo se usa el sitio y mejorarlo.
        <strong>Solo se activan si las aceptas.</strong>
        Puedes cambiar tu decisión en "Configurar cookies", al pie de la página.
        <a href="privacidad.html#cookies" class="cookie-banner__link">Más información</a>
      </p>
      <div class="cookie-banner__actions">
        <button type="button" data-reject class="cookie-banner__button">${escapeHtml("Rechazar")}</button>
        <button type="button" data-accept class="cookie-banner__button cookie-banner__button--primary">${escapeHtml("Aceptar")}</button>
      </div>
    </div>`;
  banner.querySelector("[data-accept]").addEventListener("click", () => onAccept(banner));
  banner.querySelector("[data-reject]").addEventListener("click", () => onReject(banner));
  return banner;
}
