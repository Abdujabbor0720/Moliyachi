import "reflect-metadata";
import { createConversation } from "@grammyjs/conversations";
import { Keyboard } from "grammy";
import { bot } from "./bot/index";
import { AppDataSource } from "./db/dataSource";
import { addExpenseConversation } from "./bot/commands/addExpense";
import { addIncomeConversation } from "./bot/commands/addIncome";
import { balanceCommand } from "./bot/commands/balance";
import { reportCommand, handleReportCallback } from "./bot/commands/report";

// Asosiy menyu klaviaturasi
const mainKeyboard = new Keyboard()
  .text("➕ Xarajat qo'shish")
  .text("💵 Daromad qo'shish")
  .row()
  .text("💰 Balans")
  .text("📊 Hisobot")
  .row()
  .text("🏠 Bosh menyu")
  .resized()
  .persistent();

async function main() {
  try {
    // Database connection
    await AppDataSource.initialize();
    console.log("✅ Ma'lumotlar bazasiga ulanildi");

    // Conversations
    bot.use(createConversation(addExpenseConversation));
    bot.use(createConversation(addIncomeConversation));

    // Start command
    bot.command("start", async (ctx) => {
      await ctx.reply(
        `👋 Assalomu alaykum! Men sizning shaxsiy moliyaviy hisob-kitob botingizman.

📋 *Mavjud buyruqlar:*

/add\\_expense — Xarajat qo'shish
/add\\_income — Daromad qo'shish
/balance — Umumiy balansni ko'rish
/report — Haftalik/oylik hisobot

Yoki pastdagi tugmalardan foydalaning! 👇`,
        { parse_mode: "Markdown", reply_markup: mainKeyboard }
      );
    });

    // Commands
    bot.command("add_expense", async (ctx) => {
      await ctx.conversation.enter("addExpenseConversation");
    });

    bot.command("add_income", async (ctx) => {
      await ctx.conversation.enter("addIncomeConversation");
    });

    bot.command("balance", balanceCommand);
    bot.command("report", reportCommand);

    // Keyboard button handlers
    bot.hears("➕ Xarajat qo'shish", async (ctx) => {
      await ctx.conversation.enter("addExpenseConversation");
    });

    bot.hears("💵 Daromad qo'shish", async (ctx) => {
      await ctx.conversation.enter("addIncomeConversation");
    });

    bot.hears("💰 Balans", balanceCommand);

    bot.hears("📊 Hisobot", reportCommand);

    bot.hears("🏠 Bosh menyu", async (ctx) => {
      await ctx.reply(
        `🏠 *Bosh menyu*

Quyidagi tugmalardan birini tanlang:

➕ *Xarajat qo'shish* — Yangi xarajat kiritish
💵 *Daromad qo'shish* — Yangi daromad kiritish
💰 *Balans* — Umumiy balansni ko'rish
📊 *Hisobot* — Haftalik/oylik hisobot`,
        { parse_mode: "Markdown", reply_markup: mainKeyboard }
      );
    });

    // Callback handlers
    bot.callbackQuery(/^report_/, handleReportCallback);

    // Error handler
    bot.catch((err) => {
      console.error("Bot xatosi:", err);
    });

    // Start bot
    console.log("🤖 Bot ishga tushmoqda...");
    await bot.start();
  } catch (error) {
    console.error("❌ Xatolik:", error);
    process.exit(1);
  }
}

main();
