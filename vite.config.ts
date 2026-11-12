import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        shoppingList: "examples/shopping-list/index.html",
      },
    },
  },
});
