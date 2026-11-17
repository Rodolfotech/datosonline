// Pure search logic for the catalog: no DOM access, so it can be tested with
// node --test. A card matches when its code is searched, or when every word of
// the query appears in its name, version, category or subcategory.

// Lowercase, without accents and with single spaces: "Colchón  Emma" -> "colchon emma".
export function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Letters and digits only: "A-000001", "a 000001" and "a000001" are the same.
function compact(text) {
  return normalizeText(text).replace(/[^a-z0-9]/g, "");
}

// "A-000001" with the query "A-1" or "a1": the number is compared, so the
// leading zeros do not matter.
function sameCodeNumber(code, query) {
  const queryNumber = /^a(\d+)$/.exec(query)?.[1];
  const codeNumber = /^a(\d+)$/.exec(compact(code))?.[1];
  return queryNumber !== undefined && codeNumber !== undefined && Number(queryNumber) === Number(codeNumber);
}

// Everything the visitor can search in one card.
export function searchableText(card, categoryName) {
  const version = card.variants?.[0]?.label;
  return normalizeText([card.title, version, categoryName, card.subcategory].filter(Boolean).join(" "));
}

export function cardMatches(card, query, categoryName = () => "") {
  const words = normalizeText(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const queryCode = compact(query);
  if (compact(card.code) === queryCode || sameCodeNumber(card.code, queryCode)) return true;
  const text = searchableText(card, categoryName(card.category));
  return words.every((word) => text.includes(word));
}

// The cards that match, in their original order.
export function searchCards(cards, query, categoryName) {
  return cards.filter((card) => cardMatches(card, query, categoryName));
}
