// Runs on the public pages. Shows the cookie choice, loads the measurement
// tools only if the visitor accepts, and reopens the choice from the footer.
import { ACCEPTED, REJECTED, mayMeasure, readConsent, saveConsent } from "./lib/consent.js";
import { renderCookieBanner } from "./components/cookie-banner.js";

let measuring = false;

// Some browsers block storage completely; then there is no saved choice.
function choiceStorage() {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

// Microsoft Clarity and Google Tag Manager, loaded only after acceptance.
function startMeasuring() {
  if (measuring) return;
  measuring = true;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "zev4fb1ne8");
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  const tagManager = document.createElement("script");
  tagManager.async = true;
  tagManager.src = "https://www.googletagmanager.com/gtm.js?id=GTM-K5NHQ678";
  document.head.append(tagManager);
}

// While the banner is open, the end of the page gets room so it does not
// cover the footer links.
function openBanner() {
  document.querySelector(".cookie-banner")?.remove();
  document.body.classList.add("has-cookie-banner");
  const banner = renderCookieBanner({
    onAccept: (element) => {
      saveConsent(choiceStorage(), ACCEPTED);
      element.remove();
      document.body.classList.remove("has-cookie-banner");
      startMeasuring();
    },
    onReject: (element) => {
      const wasAccepted = mayMeasure(readConsent(choiceStorage()));
      saveConsent(choiceStorage(), REJECTED);
      element.remove();
      document.body.classList.remove("has-cookie-banner");
      // The tools loaded before this choice cannot be unloaded: reload to stop them.
      if (wasAccepted) window.location.reload();
    },
  });
  document.body.append(banner);
}

// The footer button reopens the choice at any time.
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-cookie-settings]")) openBanner();
});

if (readConsent(choiceStorage()) === ACCEPTED) startMeasuring();
else if (readConsent(choiceStorage()) === null) openBanner();
