// Brand logo shared by the navbar and the footer. Two versions: the one for a
// light background and the one for a dark background. The page's theme and
// the footer's dark background decide which one shows (see src/style.css).
export function logoHtml() {
  return `
    <a href="./" aria-label="DatosOnline, ir al inicio" class="logo">
      <img src="img/logo-claro.webp" alt="" width="720" height="160" class="logo__img logo__img--light" />
      <img src="img/logo-oscuro.webp" alt="" width="720" height="160" class="logo__img logo__img--dark" />
    </a>`;
}
