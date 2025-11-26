import { I18n } from "@grammyjs/i18n";
import path from "path";

// i18n konfiguratsiyasi
export const i18n = new I18n({
  defaultLocale: "uz",
  directory: path.join(__dirname, "locales"),
  useSession: true,
  fluentBundleOptions: {
    useIsolating: false,
  },
});

// Mavjud tillar
export const AVAILABLE_LANGUAGES = [
  { code: "uz", name: "🇺🇿 O'zbek", flag: "🇺🇿" },
  { code: "ru", name: "🇷🇺 Русский", flag: "🇷🇺" },
  { code: "en", name: "🇬🇧 English", flag: "🇬🇧" },
];

// Til kodini olish
export function getLanguageByCode(code: string) {
  return AVAILABLE_LANGUAGES.find((lang) => lang.code === code);
}
