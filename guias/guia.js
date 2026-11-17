import "../src/components/navbar.js";
import "../src/components/footer.js";
import "../src/components/product-card.js";
import { products } from "../src/data/products.js";
import { getCards } from "../src/lib/products.js";

// Puts the product cards named in each guide (data-guide-cards="id1 id2")
// in place, using the same data as the catalog, so prices and links stay in sync.
const cards = getCards(products);
for (const holder of document.querySelectorAll("[data-guide-cards]")) {
  for (const id of holder.dataset.guideCards.split(" ")) {
    const card = cards.find((item) => item.cardId === id);
    if (!card) continue;
    const element = document.createElement("product-card");
    element.product = card;
    holder.append(element);
  }
}
