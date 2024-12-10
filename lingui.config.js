import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  fallbackLocales: {
    default: "en",
  },
  locales: ["en", "el", "ar-EG"],
  catalogs: [
    {
      path: "<rootDir>/lib/locales/{locale}/messages",
      include: ["app", "components"],
    },
  ],
});