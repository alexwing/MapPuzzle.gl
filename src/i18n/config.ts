import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en/translation.json";
import es from "./es/translation.json";
import fr from "./fr/translation.json";
import pt from "./pt/translation.json";
import de from "./de/translation.json";
import el from "./el/translation.json";
import it from "./it/translation.json";

export const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  pt: {
    translation: pt,
  },
  de: {
    translation: de,
  },
  el: {
    translation: el,
  },
  it: {
    translation: it,
  },
};

i18next.use(initReactI18next).init({
  lng: "en", // if you're using a language detector, do not define the lng option
  debug: true,
  resources,
  fallbackLng: "en", // Use English as fallback language
});
