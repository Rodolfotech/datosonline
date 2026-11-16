import "./components/navbar.js";
import "./components/footer.js";
import "./components/product-grid.js";
import { categories } from "./data/categories.js";
import { products } from "./data/products.js";
import { getActiveCategorySlug, getSiteCategories } from "./lib/categories.js";

const siteCategories = getSiteCategories(categories, products);
const activeSlug = getActiveCategorySlug(window.location.search, siteCategories);
document.querySelector("site-navbar").setAttribute("active-category", activeSlug);
document.querySelector("product-grid").setAttribute("category", activeSlug);
