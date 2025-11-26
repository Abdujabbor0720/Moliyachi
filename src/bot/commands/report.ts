import type { MyContext } from "../index";
import { findOrCreateUser } from "../../services/user.service";
import { weeklyReport, monthlyReport } from "../../services/report.service";
import { formatReport } from "../../utils/format";
import { InlineKeyboard } from "grammy";

export async function reportCommand(ctx: MyContext) {
  const keyboard = new InlineKeyboard()
    .text("📅 Haftalik", "report_weekly")
    .text("📆 Oylik", "report_monthly");

  await ctx.reply("📊 Qaysi davr uchun hisobot olmoqchisiz?", {
    reply_markup: keyboard,
  });
}

export async function handleReportCallback(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCallbackQuery("❌ Foydalanuvchi aniqlanmadi.");
    return;
  }

  const callbackData = ctx.callbackQuery?.data;
  const user = await findOrCreateUser(telegramId);

  let report;
  if (callbackData === "report_weekly") {
    report = await weeklyReport(user.id);
  } else if (callbackData === "report_monthly") {
    report = await monthlyReport(user.id);
  } else {
    await ctx.answerCallbackQuery("❌ Noma'lum tanlov.");
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    formatReport(
      report.periodName,
      report.categoryExpenses,
      report.totalIncome,
      report.totalExpense
    ),
    { parse_mode: "Markdown" }
  );
}
