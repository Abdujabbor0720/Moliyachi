import type { MyContext, MyConversation } from "../index";
import { findOrCreateUser, getUserLanguage } from "../../services/user.service";
import { createIncome } from "../../services/income.service";
import { t, getSourceKeyboard, getMainKeyboard } from "../../utils/language";
import { ADMIN_IDS } from "../../admin/types";

function formatNumber(num: number): string {
  return num.toLocaleString("uz-UZ");
}

export async function addIncomeConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply("❌ Error");
    return;
  }

  const lang = (await getUserLanguage(telegramId)) || "uz";
  const isAdmin = ADMIN_IDS.includes(telegramId);

  // Summa so'rash
  await ctx.reply(t(lang, "income_enter_amount"), {
    parse_mode: "Markdown",
    reply_markup: getSourceKeyboard(lang),
  });

  let amount: number = 0;

  while (true) {
    const amountCtx = await conversation.wait();
    const amountText = amountCtx.message?.text?.trim();

    // Bekor qilish
    if (
      amountText === t(lang, "btn_cancel") ||
      amountText === t("uz", "btn_cancel") ||
      amountText === t("ru", "btn_cancel") ||
      amountText === t("en", "btn_cancel")
    ) {
      await ctx.reply(t(lang, "cancelled"), {
        reply_markup: getMainKeyboard(lang, isAdmin),
      });
      return;
    }

    const parsed = parseFloat(amountText || "");

    if (isNaN(parsed) || parsed <= 0) {
      await ctx.reply(t(lang, "income_invalid_amount"));
      continue;
    }

    amount = parsed;
    break;
  }

  // Manba so'rash
  await ctx.reply(t(lang, "income_enter_source"), {
    parse_mode: "Markdown",
    reply_markup: getSourceKeyboard(lang),
  });

  const sourceCtx = await conversation.wait();
  const sourceText = sourceCtx.message?.text?.trim();

  // Bekor qilish
  if (
    sourceText === t(lang, "btn_cancel") ||
    sourceText === t("uz", "btn_cancel") ||
    sourceText === t("ru", "btn_cancel") ||
    sourceText === t("en", "btn_cancel")
  ) {
    await ctx.reply(t(lang, "cancelled"), {
      reply_markup: getMainKeyboard(lang, isAdmin),
    });
    return;
  }

  const source = sourceText || t(lang, "source_other");

  // Izoh so'rash
  await ctx.reply(t(lang, "income_enter_description"), {
    parse_mode: "Markdown",
  });

  const descCtx = await conversation.wait();
  const descText = descCtx.message?.text?.trim();
  const description =
    descText === "/skip" ? t(lang, "skip") : descText || t(lang, "skip");

  // Saqlash
  const user = await findOrCreateUser(telegramId);
  await createIncome(user.id, source, amount);

  await ctx.reply(
    t(lang, "income_success", {
      amount: formatNumber(amount),
      source,
      description,
    }),
    {
      parse_mode: "Markdown",
      reply_markup: getMainKeyboard(lang, isAdmin),
    }
  );
}
