import type { MyContext } from "../index";
import { findOrCreateUser, getUserLanguage } from "../../services/user.service";
import { calculateBalance } from "../../services/balance.service";
import { t } from "../../utils/language";

function formatNumber(num: number): string {
  return num.toLocaleString("uz-UZ");
}

export async function balanceCommand(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply("❌ Error");
    return;
  }

  const lang = (await getUserLanguage(telegramId)) || "uz";
  const user = await findOrCreateUser(telegramId);
  const { totalIncome, totalExpense } = await calculateBalance(user.id);

  if (totalIncome === 0 && totalExpense === 0) {
    await ctx.reply(t(lang, "balance_no_data"), {
      parse_mode: "Markdown",
    });
    return;
  }

  const balance = totalIncome - totalExpense;
  const message = `${t(lang, "balance_title")}${t(
    lang,
    "balance_total_income",
    { amount: formatNumber(totalIncome) }
  )}\n${t(lang, "balance_total_expense", {
    amount: formatNumber(totalExpense),
  })}\n\n${t(lang, "balance_current", { amount: formatNumber(balance) })}`;

  await ctx.reply(message, {
    parse_mode: "Markdown",
  });
}
