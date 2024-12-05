import { i18n } from "@lingui/core";

export const locales = {
  en: "English",
  ar: "Arabic",
  el: "Greek",
};

const localMessages: Record<keyof typeof locales, any> = {
  en: require("./locales/en/messages"),
  ar: require("./locales/ar/messages"),
  el: require("./locales/el/messages"),
};

export const defaultLocale = "en" as keyof typeof locales;

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: string) {
  const targetLocale = locale in localMessages ? locale : defaultLocale;
  const { messages } = localMessages[targetLocale as keyof typeof locales];

  i18n.loadAndActivate({
    locale: targetLocale,
    messages,
  });
}
