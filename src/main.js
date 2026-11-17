import "./components/navbar.js";
import "./components/footer.js";
import "./components/product-grid.js";
import { categories } from "./data/categories.js";
import { products } from "./data/products.js";
import { site } from "./data/site.js";
import { getActiveCategorySlug, getSiteCategories } from "./lib/categories.js";
import { getCards } from "./lib/products.js";
import { buildItemList } from "./lib/structured-data.js";

const siteCategories = getSiteCategories(categories, products);
const activeSlug = getActiveCategorySlug(window.location.search, siteCategories);
document.querySelector("site-navbar").setAttribute("active-category", activeSlug);
document.querySelector("product-grid").setAttribute("category", activeSlug);

// Each category page gets its own title in the browser tab and in search results.
const activeName = siteCategories.find((category) => category.slug === activeSlug)?.name;
if (activeName) document.title = `${activeName} | DatosOnline Chile`;

// The product list as structured data, so search engines read it as a catalog.
const listData = document.createElement("script");
listData.type = "application/ld+json";
listData.textContent = JSON.stringify(buildItemList(getCards(products), site.baseUrl));
document.head.append(listData);
