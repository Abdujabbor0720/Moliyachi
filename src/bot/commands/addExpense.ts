import type { MyContext, MyConversation } from "../index";
import { findOrCreateUser, getUserLanguage } from "../../services/user.service";
import { createExpense } from "../../services/expense.service";
import {
  t,
  getCategoryKeyboard,
  getMainKeyboard,
  getCategoryKey,
} from "../../utils/language";
import { ADMIN_IDS } from "../../admin/types";

function formatNumber(num: number): string {
  return num.toLocaleString("uz-UZ");
}

export async function addExpenseConversation(
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
  await ctx.reply(t(lang, "expense_enter_amount"), {
    parse_mode: "Markdown",
    reply_markup: getCategoryKeyboard(lang),
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
      await ctx.reply(t(lang, "expense_invalid_amount"));
      continue;
    }

    amount = parsed;
    break;
  }

  // Kategoriya so'rash
  await ctx.reply(t(lang, "expense_enter_category"), {
    parse_mode: "Markdown",
    reply_markup: getCategoryKeyboard(lang),
  });

  const categoryCtx = await conversation.wait();
  const categoryText = categoryCtx.message?.text?.trim();

  // Bekor qilish
  if (
    categoryText === t(lang, "btn_cancel") ||
    categoryText === t("uz", "btn_cancel") ||
    categoryText === t("ru", "btn_cancel") ||
    categoryText === t("en", "btn_cancel")
  ) {
    await ctx.reply(t(lang, "cancelled"), {
      reply_markup: getMainKeyboard(lang, isAdmin),
    });
    return;
  }

  const category = categoryText || t(lang, "category_other");

  // Izoh so'rash
  await ctx.reply(t(lang, "expense_enter_description"), {
    parse_mode: "Markdown",
  });

  const descCtx = await conversation.wait();
  const descText = descCtx.message?.text?.trim();
  const description =
    descText === "/skip" ? t(lang, "skip") : descText || t(lang, "skip");

  // Saqlash
  const user = await findOrCreateUser(telegramId);
  await createExpense(user.id, description, amount, category);

  await ctx.reply(
    t(lang, "expense_success", {
      amount: formatNumber(amount),
      category,
      description,
    }),
    {
      parse_mode: "Markdown",
      reply_markup: getMainKeyboard(lang, isAdmin),
    }
  );
}
