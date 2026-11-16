// Reusable confirmation dialog. Asks a question and resolves to true when the
// user accepts, or to false on "cancel", the Escape key or a click outside.
//
//   import { confirmDialog } from "./confirm-dialog.js";
//
//   const accepted = await confirmDialog({
//     title: "Eliminar producto",
//     message: "¿Estás seguro de eliminar el producto? Nada se podrá recuperar.",
//     detail: "Colchón Emma",        // optional, shown highlighted
//     confirmLabel: "Eliminar",
//     cancelLabel: "Cancelar",
//     tone: "danger",                // "danger" or "default"
//   });
//
// Built on the native <dialog>, which keeps the focus inside while it is open
// and blocks the rest of the page. Styles live in src/style.css under "Diálogo".
import { escapeHtml } from "../lib/categories.js";

const CONFIRM_VALUE = "confirm";
let dialogCount = 0;

export function confirmDialog({ title, message, detail = "", confirmLabel = "Aceptar", cancelLabel = "Cancelar", tone = "default" }) {
  dialogCount += 1;
  const titleId = `dialog-title-${dialogCount}`;
  const messageId = `dialog-message-${dialogCount}`;
  const confirmClass = tone === "danger" ? "dialog__button dialog__button--danger" : "dialog__button dialog__button--primary";

  const dialog = document.createElement("dialog");
  dialog.className = "dialog";
  dialog.setAttribute("aria-labelledby", titleId);
  dialog.setAttribute("aria-describedby", messageId);
  // The inner box covers the whole dialog, so a click that lands on the
  // <dialog> element itself can only come from the dimmed area around it.
  dialog.innerHTML = `
    <form method="dialog" class="dialog__box">
      <h2 id="${titleId}" class="dialog__title">${escapeHtml(title)}</h2>
      <p id="${messageId}" class="dialog__message">${escapeHtml(message)}</p>
      ${detail ? `<p class="dialog__detail">${escapeHtml(detail)}</p>` : ""}
      <div class="dialog__actions">
        <button type="submit" value="" autofocus class="dialog__button">${escapeHtml(cancelLabel)}</button>
        <button type="submit" value="${CONFIRM_VALUE}" class="${confirmClass}">${escapeHtml(confirmLabel)}</button>
      </div>
    </form>`;

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close("");
  });

  return new Promise((resolve) => {
    // Every way of closing ends here: buttons, Escape and the outside click.
    dialog.addEventListener("close", () => {
      dialog.remove();
      resolve(dialog.returnValue === CONFIRM_VALUE);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}
