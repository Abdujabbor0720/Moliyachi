import type { MyContext } from "../index";
import { findOrCreateUser, getUserLanguage } from "../../services/user.service";
import { weeklyReport, monthlyReport } from "../../services/report.service";
import { t, getReportKeyboard } from "../../utils/language";

function formatNumber(num: number): string {
  return num.toLocaleString("uz-UZ");
}

export async function reportCommand(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const lang = (await getUserLanguage(telegramId)) || "uz";

  await ctx.reply(t(lang, "report_select_period"), {
    parse_mode: "Markdown",
    reply_markup: getReportKeyboard(lang),
  });
}

export async function handleReportCallback(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCallbackQuery("❌ Error");
    return;
  }

  const lang = (await getUserLanguage(telegramId)) || "uz";
  const callbackData = ctx.callbackQuery?.data;
  const user = await findOrCreateUser(telegramId);

  let report;
  let periodKey: string;

  if (callbackData === "report_weekly") {
    report = await weeklyReport(user.id);
    periodKey = "report_period_weekly";
  } else if (callbackData === "report_monthly") {
    report = await monthlyReport(user.id);
    periodKey = "report_period_monthly";
  } else {
    await ctx.answerCallbackQuery("❌ Error");
    return;
  }

  await ctx.answerCallbackQuery();

  if (report.totalIncome === 0 && report.totalExpense === 0) {
    await ctx.editMessageText(t(lang, "report_no_data"), {
      parse_mode: "Markdown",
    });
    return;
  }

  const balance = report.totalIncome - report.totalExpense;
  const periodName = t(lang, periodKey);

  let message = t(lang, "report_title", { period: periodName });
  message += `${t(lang, "report_income", {
    amount: formatNumber(report.totalIncome),
  })}\n`;
  message += `${t(lang, "report_expense", {
    amount: formatNumber(report.totalExpense),
  })}\n\n`;
  message += t(lang, "report_balance", { amount: formatNumber(balance) });

  await ctx.editMessageText(message, { parse_mode: "Markdown" });
}
