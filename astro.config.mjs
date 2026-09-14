// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  build: { inlineStylesheets: 'always' },
  // Defina o domínio de produção para gerar canonical/OG absolutos:
  // site: "https://seu-dominio.com",
});
