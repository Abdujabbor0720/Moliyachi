import { Keyboard, InlineKeyboard } from "grammy";
import type { MyContext } from "../bot/index";
import { getUserLanguage } from "../services/user.service";
import { AVAILABLE_LANGUAGES } from "../i18n";
import * as path from "path";
import * as fs from "fs";

// JSON fayllardan tarjimalarni yuklash
const localesPath = path.join(__dirname, "../locales");
const uzTranslations = JSON.parse(
  fs.readFileSync(path.join(localesPath, "uz.json"), "utf-8")
);
const ruTranslations = JSON.parse(
  fs.readFileSync(path.join(localesPath, "ru.json"), "utf-8")
);
const enTranslations = JSON.parse(
  fs.readFileSync(path.join(localesPath, "en.json"), "utf-8")
);

const translations: Record<string, Record<string, string>> = {
  uz: uzTranslations,
  ru: ruTranslations,
  en: enTranslations,
};

// Tarjima olish funksiyasi
export function t(
  lang: string,
  key: string,
  params?: Record<string, string | number>
): string {
  const langTranslations = translations[lang] || translations["uz"];
  let text = langTranslations[key] || translations["uz"][key] || key;

  // Parametrlarni almashtirish
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value));
    });
  }

  return text;
}

// Context'dan til olish
export async function getLang(ctx: MyContext): Promise<string> {
  if (ctx.from) {
    const lang = await getUserLanguage(ctx.from.id);
    return lang || "uz";
  }
  return ctx.session?.__language_code || "uz";
}

// Til tanlash keyboard
export function getLanguageKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  AVAILABLE_LANGUAGES.forEach((lang, index) => {
    keyboard.text(lang.name, `set_lang:${lang.code}`);
    if ((index + 1) % 2 === 0) keyboard.row();
  });

  return keyboard;
}

// Asosiy menyu keyboard (tilga qarab)
export function getMainKeyboard(
  lang: string,
  isAdmin: boolean = false
): Keyboard {
  const keyboard = new Keyboard()
    .text(t(lang, "btn_add_expense"))
    .text(t(lang, "btn_add_income"))
    .row()
    .text(t(lang, "btn_balance"))
    .text(t(lang, "btn_report"))
    .row()
    .text(t(lang, "btn_language"));

  if (isAdmin) {
    keyboard.text(t(lang, "btn_admin"));
  }

  return keyboard.resized().persistent();
}

// Bekor qilish keyboard
export function getCancelKeyboard(lang: string): Keyboard {
  return new Keyboard().text(t(lang, "btn_cancel")).resized();
}

// Kategoriyalar keyboard
export function getCategoryKeyboard(lang: string): Keyboard {
  return new Keyboard()
    .text(t(lang, "category_food"))
    .text(t(lang, "category_transport"))
    .row()
    .text(t(lang, "category_entertainment"))
    .text(t(lang, "category_utilities"))
    .row()
    .text(t(lang, "category_health"))
    .text(t(lang, "category_education"))
    .row()
    .text(t(lang, "category_clothing"))
    .text(t(lang, "category_other"))
    .row()
    .text(t(lang, "btn_cancel"))
    .resized();
}

// Daromad manbalari keyboard
export function getSourceKeyboard(lang: string): Keyboard {
  return new Keyboard()
    .text(t(lang, "source_salary"))
    .text(t(lang, "source_freelance"))
    .row()
    .text(t(lang, "source_business"))
    .text(t(lang, "source_investment"))
    .row()
    .text(t(lang, "source_gift"))
    .text(t(lang, "source_other"))
    .row()
    .text(t(lang, "btn_cancel"))
    .resized();
}

// Hisobot davri keyboard
export function getReportKeyboard(lang: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(lang, "report_weekly"), "report_weekly")
    .text(t(lang, "report_monthly"), "report_monthly");
}

// Admin panel keyboard
export function getAdminKeyboard(lang: string): Keyboard {
  return new Keyboard()
    .text(t(lang, "admin_btn_channels"))
    .text(t(lang, "admin_btn_broadcast"))
    .row()
    .text(t(lang, "admin_btn_statistics"))
    .text(t(lang, "admin_btn_users"))
    .row()
    .text(t(lang, "admin_btn_back_bot"))
    .resized()
    .persistent();
}

// Kanallar keyboard
export function getChannelsKeyboard(lang: string): Keyboard {
  return new Keyboard()
    .text(t(lang, "admin_btn_add_channel"))
    .text(t(lang, "admin_btn_channel_list"))
    .row()
    .text(t(lang, "admin_btn_back_panel"))
    .resized()
    .persistent();
}

// Kanal turi keyboard
export function getChannelTypeKeyboard(lang: string): Keyboard {
  return new Keyboard()
    .text(t(lang, "admin_btn_channel"))
    .text(t(lang, "admin_btn_group"))
    .row()
    .text(t(lang, "admin_btn_bot"))
    .row()
    .text(t(lang, "btn_cancel"))
    .resized();
}

// Broadcast keyboard
export function getBroadcastKeyboard(lang: string): Keyboard {
  return new Keyboard()
    .text(t(lang, "admin_btn_write_message"))
    .row()
    .text(t(lang, "admin_btn_back_panel"))
    .resized()
    .persistent();
}

// Tasdiqlash keyboard
export function getConfirmKeyboard(lang: string): Keyboard {
  return new Keyboard()
    .text(t(lang, "admin_btn_confirm"))
    .text(t(lang, "btn_cancel"))
    .resized();
}

// Obuna tekshirish keyboard
export function getSubscriptionKeyboard(
  lang: string,
  channels: { url: string; title: string }[]
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const channel of channels) {
    keyboard.url(`📢 ${channel.title}`, channel.url).row();
  }

  keyboard.text(t(lang, "check_subscription"), "check_subscription");

  return keyboard;
}

// Kategoriya nomini olish (har qanday tilda)
export function getCategoryKey(categoryText: string): string {
  const categories = [
    "category_food",
    "category_transport",
    "category_entertainment",
    "category_utilities",
    "category_health",
    "category_education",
    "category_clothing",
    "category_other",
  ];

  for (const lang of ["uz", "ru", "en"]) {
    for (const cat of categories) {
      if (t(lang, cat) === categoryText) {
        return cat;
      }
    }
  }

  return "category_other";
}

// Manba nomini olish (har qanday tilda)
export function getSourceKey(sourceText: string): string {
  const sources = [
    "source_salary",
    "source_freelance",
    "source_business",
    "source_investment",
    "source_gift",
    "source_other",
  ];

  for (const lang of ["uz", "ru", "en"]) {
    for (const src of sources) {
      if (t(lang, src) === sourceText) {
        return src;
      }
    }
  }

  return "source_other";
}
