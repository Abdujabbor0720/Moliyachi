import "reflect-metadata";
import { createConversation } from "@grammyjs/conversations";
import { Keyboard } from "grammy";
import { bot, MyContext } from "./bot/index";
import { AppDataSource } from "./db/dataSource";
import { addExpenseConversation } from "./bot/commands/addExpense";
import { addIncomeConversation } from "./bot/commands/addIncome";
import { balanceCommand } from "./bot/commands/balance";
import { reportCommand, handleReportCallback } from "./bot/commands/report";
import { findOrCreateUser } from "./services/user.service";
import {
  subscriptionMiddleware,
  checkUserSubscription,
} from "./admin/subscription";
import { createSubscriptionKeyboard } from "./admin/keyboards";
import {
  isAdmin,
  getAdminState,
  openAdminPanel,
  openChannelsSection,
  startAddChannel,
  handleChannelType,
  handleChannelId,
  handleChannelTitle,
  handleChannelUrl,
  showChannelsList,
  handleToggleChannel,
  handleDeleteChannel,
  openBroadcastSection,
  startBroadcast,
  handleBroadcastMessage,
  confirmBroadcast,
  showStatistics,
  cancelAdminAction,
} from "./admin/handlers";
import { AdminState, ADMIN_IDS } from "./admin/types";

// Asosiy menyu klaviaturasi (dinamik - admin uchun alohida tugma)
function getMainKeyboard(userId?: number): Keyboard {
  const keyboard = new Keyboard()
    .text("➕ Xarajat qo'shish")
    .text("💵 Daromad qo'shish")
    .row()
    .text("💰 Balans")
    .text("📊 Hisobot")
    .row();

  // Agar foydalanuvchi admin bo'lsa, admin tugmasini qo'shish
  if (userId && ADMIN_IDS.includes(userId)) {
    keyboard.text("🏠 Bosh menyu").text("👨‍💼 Admin");
  } else {
    keyboard.text("🏠 Bosh menyu");
  }

  return keyboard.resized().persistent();
}

async function main() {
  try {
    // Database connection
    await AppDataSource.initialize();
    console.log("✅ Ma'lumotlar bazasiga ulanildi");

    // Conversations
    bot.use(createConversation(addExpenseConversation));
    bot.use(createConversation(addIncomeConversation));

    // Admin panel command (obuna tekshirilmaydi)
    bot.command("admin", openAdminPanel);

    // Obuna tekshirish callback (obuna tekshirilmaydi)
    bot.callbackQuery("check_subscription", async (ctx) => {
      if (!ctx.from) return;

      const { isSubscribed, missingChannels } = await checkUserSubscription(
        ctx.from.id
      );

      if (isSubscribed) {
        await ctx.answerCallbackQuery({ text: "✅ Obuna tasdiqlandi!" });
        try {
          await ctx.editMessageText(
            `✅ *Rahmat! Obuna tasdiqlandi!*\n\nEndi botdan foydalanishingiz mumkin.\n/start buyrug'ini bosing yoki pastdagi tugmalardan foydalaning.`,
            { parse_mode: "Markdown" }
          );
        } catch (e) {
          // Xabar allaqachon o'zgartirilgan bo'lishi mumkin
        }
      } else {
        await ctx.answerCallbackQuery({
          text: "❌ Siz hali barcha kanallarga obuna bo'lmagansiz!",
          show_alert: true,
        });
        // Xabarni o'zgartirishga urinmaymiz - faqat alert ko'rsatamiz
      }
    });

    // Obuna tekshirish funksiyasi
    async function checkAndRequireSubscription(
      ctx: MyContext
    ): Promise<boolean> {
      if (!ctx.from) return true;

      // Admin tekshiruvidan o'tkazmaymiz
      if (ADMIN_IDS.includes(ctx.from.id)) return true;

      const { isSubscribed, missingChannels } = await checkUserSubscription(
        ctx.from.id
      );

      if (!isSubscribed && missingChannels.length > 0) {
        await ctx.reply(
          `👋 Hurmatli foydalanuvchi!\n\n📢 Botdan foydalanish uchun avval quyidagi kanalga obuna bo'lishingiz kerak:\n\n✨ Obuna bo'lgandan so'ng "✅ Tekshirish" tugmasini bosing.`,
          {
            parse_mode: "Markdown",
            reply_markup: createSubscriptionKeyboard(missingChannels),
          }
        );
        return false;
      }

      return true;
    }

    // Start command
    bot.command("start", async (ctx) => {
      // Foydalanuvchini saqlash
      if (ctx.from) {
        await findOrCreateUser(
          ctx.from.id,
          ctx.from.username,
          ctx.from.first_name
        );
      }

      // Obuna tekshirish
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;

      await ctx.reply(
        `👋 Assalomu alaykum! Men sizning shaxsiy moliyaviy hisob-kitob botingizman.

📋 *Mavjud buyruqlar:*

/add\\_expense — Xarajat qo'shish
/add\\_income — Daromad qo'shish
/balance — Umumiy balansni ko'rish
/report — Haftalik/oylik hisobot

Yoki pastdagi tugmalardan foydalaning! 👇`,
        { parse_mode: "Markdown", reply_markup: getMainKeyboard(ctx.from?.id) }
      );
    });

    // Commands
    bot.command("add_expense", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await ctx.conversation.enter("addExpenseConversation");
    });

    bot.command("add_income", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await ctx.conversation.enter("addIncomeConversation");
    });

    bot.command("balance", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await balanceCommand(ctx);
    });

    bot.command("report", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await reportCommand(ctx);
    });

    // Keyboard button handlers
    bot.hears("➕ Xarajat qo'shish", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await ctx.conversation.enter("addExpenseConversation");
    });

    bot.hears("💵 Daromad qo'shish", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await ctx.conversation.enter("addIncomeConversation");
    });

    bot.hears("💰 Balans", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await balanceCommand(ctx);
    });

    bot.hears("📊 Hisobot", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await reportCommand(ctx);
    });

    // Admin tugmasi (faqat adminlar uchun)
    bot.hears("👨‍💼 Admin", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await openAdminPanel(ctx);
      }
    });

    bot.hears("🏠 Bosh menyu", async (ctx) => {
      const canProceed = await checkAndRequireSubscription(ctx);
      if (!canProceed) return;
      await ctx.reply(
        `🏠 *Bosh menyu*

Quyidagi tugmalardan birini tanlang:

➕ *Xarajat qo'shish* — Yangi xarajat kiritish
💵 *Daromad qo'shish* — Yangi daromad kiritish
💰 *Balans* — Umumiy balansni ko'rish
📊 *Hisobot* — Haftalik/oylik hisobot`,
        { parse_mode: "Markdown", reply_markup: getMainKeyboard(ctx.from?.id) }
      );
    });

    // Callback handlers
    bot.callbackQuery(/^report_/, handleReportCallback);

    // Admin channel callbacks
    bot.callbackQuery(/^toggle_channel:/, async (ctx) => {
      const channelId = ctx.callbackQuery.data.split(":")[1];
      await handleToggleChannel(ctx, channelId);
    });

    bot.callbackQuery(/^delete_channel:/, async (ctx) => {
      const channelId = ctx.callbackQuery.data.split(":")[1];
      await handleDeleteChannel(ctx, channelId);
    });

    // Admin panel handlers
    bot.hears("📢 Majburiy kanallar", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await openChannelsSection(ctx);
      }
    });

    bot.hears("📨 Xabar yuborish", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await openBroadcastSection(ctx);
      }
    });

    bot.hears("📊 Statistika", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await showStatistics(ctx);
      }
    });

    bot.hears("👥 Foydalanuvchilar", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await showStatistics(ctx);
      }
    });

    bot.hears("🔙 Botga qaytish", async (ctx) => {
      await ctx.reply(
        `🏠 *Bosh menyu*\n\nQuyidagi tugmalardan birini tanlang:`,
        { parse_mode: "Markdown", reply_markup: getMainKeyboard(ctx.from?.id) }
      );
    });

    bot.hears("🔙 Admin panelga qaytish", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await openAdminPanel(ctx);
      }
    });

    bot.hears("➕ Kanal qo'shish", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await startAddChannel(ctx);
      }
    });

    bot.hears("📋 Kanallar ro'yxati", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await showChannelsList(ctx);
      }
    });

    bot.hears("📝 Xabar yozish", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await startBroadcast(ctx);
      }
    });

    bot.hears("✅ Tasdiqlash", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await confirmBroadcast(ctx);
      }
    });

    bot.hears("❌ Bekor qilish", async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id)) {
        await cancelAdminAction(ctx);
      }
    });

    // Channel type handlers
    bot.hears(["📢 Kanal", "👥 Guruh", "🤖 Bot"], async (ctx) => {
      if (ctx.from && isAdmin(ctx.from.id) && ctx.message?.text) {
        const state = getAdminState(ctx.from.id);
        if (
          state.state === AdminState.ADDING_CHANNEL &&
          state.data?.step === "type"
        ) {
          await handleChannelType(ctx, ctx.message.text);
        }
      }
    });

    // Admin state message handler
    bot.on("message:text", async (ctx, next) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) {
        return next();
      }

      const state = getAdminState(ctx.from.id);

      if (state.state === AdminState.ADDING_CHANNEL) {
        if (state.data?.step === "id") {
          await handleChannelId(ctx, ctx.message.text);
          return;
        } else if (state.data?.step === "title") {
          await handleChannelTitle(ctx, ctx.message.text);
          return;
        } else if (state.data?.step === "url") {
          await handleChannelUrl(ctx, ctx.message.text);
          return;
        }
      }

      return next();
    });

    // Admin broadcast message handler
    bot.on("message", async (ctx, next) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) {
        return next();
      }

      const state = getAdminState(ctx.from.id);

      if (state.state === AdminState.BROADCASTING) {
        await handleBroadcastMessage(ctx);
        return;
      }

      return next();
    });

    // Subscription middleware for other messages
    bot.use(subscriptionMiddleware);

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
