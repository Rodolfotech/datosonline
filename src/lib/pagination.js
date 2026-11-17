// Pure pagination logic: no DOM access, so it can be tested with node --test.
// Pages start at 1.

export const ELLIPSIS = "…";

// Number of pages for `count` items; there is always at least one page.
export function totalPages(count, perPage) {
  return Math.max(1, Math.ceil(count / perPage));
}

// A page number inside 1..pages, whatever the input was.
export function clampPage(page, pages) {
  const number = Math.floor(Number(page));
  if (!Number.isFinite(number) || number < 1) return 1;
  return Math.min(number, pages);
}

// The items of one page, with the page actually shown (it can differ from the
// one asked for when that page does not exist).
export function pageSlice(items, page, perPage) {
  const pages = totalPages(items.length, perPage);
  const current = clampPage(page, pages);
  const start = (current - 1) * perPage;
  return { items: items.slice(start, start + perPage), page: current, pages };
}

// Buttons to show: the first and last pages, the current one with its
// neighbours, and "…" where pages are left out.
export function pageNumbers(current, pages) {
  const shown = new Set([1, pages]);
  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= pages) shown.add(page);
  }
  const sorted = [...shown].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const gap = index > 0 && page - sorted[index - 1] > 1;
    return gap ? [ELLIPSIS, page] : [page];
  });
}
