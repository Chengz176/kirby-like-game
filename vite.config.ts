import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    base: '/kirby-style-game/',
    plugins: [react()],
    build: {
        minify: false,
    },
});
