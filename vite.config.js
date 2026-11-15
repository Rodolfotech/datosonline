import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative asset paths: the build works on a custom domain and in a
  // subfolder such as usuario.github.io/datosonline/.
  base: "./",
  plugins: [tailwindcss()],
});
