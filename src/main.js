import "./components/navbar.js";
import "./components/footer.js";
import "./components/product-grid.js";
import { categories } from "./data/categories.js";
import { getActiveCategorySlug } from "./lib/categories.js";

const activeSlug = getActiveCategorySlug(window.location.search, categories);
document.querySelector("site-navbar").setAttribute("active-category", activeSlug);
document.querySelector("product-grid").setAttribute("category", activeSlug);
