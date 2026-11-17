// Structured data (schema.org) describing the product list of the home page,
// so search engines read it as a catalog of products. Pure: no DOM access.
// It states only what the site knows: name, link and photo. No prices or
// availability, which can change on Mercado Libre.

export function buildItemList(cards, baseUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Productos de Mercado Libre seleccionados por DatosOnline",
    itemListElement: cards.map((card, index) => {
      const item = {
        "@type": "ListItem",
        position: index + 1,
        name: [card.title, card.variants[0]?.label].filter(Boolean).join(" • "),
        url: `${baseUrl}#${card.cardId}`,
      };
      const photo = card.images[0];
      if (photo) item.image = `${baseUrl}/${photo}`;
      return item;
    }),
  };
}
