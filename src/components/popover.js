// Reusable popover: a short message shown above its content while the pointer
// is over it or it has keyboard focus.
//
//   <info-popover text="Message to show">
//     <a href="...">Any link or button</a>
//   </info-popover>
//
// Styles live in src/style.css under "Popover".

let popoverCount = 0;

class InfoPopover extends HTMLElement {
  static observedAttributes = ["text"];

  connectedCallback() {
    if (this.bubble) return;
    const trigger = this.firstElementChild;

    this.bubble = document.createElement("span");
    this.bubble.className = "popover__bubble";
    this.bubble.id = `info-popover-${(popoverCount += 1)}`;
    this.bubble.setAttribute("role", "tooltip");
    this.bubble.textContent = this.getAttribute("text") ?? "";
    this.append(this.bubble);

    // Screen readers announce the message together with the link or button.
    trigger?.setAttribute("aria-describedby", this.bubble.id);

    this.addEventListener("keydown", this.handleKeydown);
    this.addEventListener("mouseleave", this.restore);
    this.addEventListener("focusout", this.restore);
  }

  attributeChangedCallback(name, oldText, newText) {
    if (this.bubble) this.bubble.textContent = newText ?? "";
  }

  // Escape hides the message without moving the focus.
  handleKeydown = (event) => {
    if (event.key === "Escape") this.setAttribute("dismissed", "");
  };

  restore = () => {
    this.removeAttribute("dismissed");
  };
}

customElements.define("info-popover", InfoPopover);
