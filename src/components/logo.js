// Brand logo shared by the navbar and the footer.
export function logoHtml() {
  return `
    <a href="./" aria-label="DatosOnline, ir al inicio" class="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ground">
      <span aria-hidden="true" class="grid size-9 place-items-center rounded-lg border-2 border-paper bg-ground font-display text-lg text-ink">D</span>
      <span class="font-display text-xl text-paper">Datos<span class="text-ground">Online</span></span>
    </a>`;
}
