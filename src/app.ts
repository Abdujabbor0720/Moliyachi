import "reflect-metadata";
import { createConversation } from "@grammyjs/conversations";
import { bot, MyContext } from "./bot/index";
import { AppDataSource } from "./db/dataSource";
import { addExpenseConversation } from "./bot/commands/addExpense";
import { addIncomeConversation } from "./bot/commands/addIncome";
import { balanceCommand } from "./bot/commands/balance";
import { reportCommand, handleReportCallback } from "./bot/commands/report";
import { findOrCreateUser, getUserLanguage, setUserLanguage } from "./services/user.service";
import { checkUserSubscription } from "./admin/subscription";
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
import {
  t,
  getLang,
  getLanguageKeyboard,
  getMainKeyboard,
  getSubscriptionKeyboard,
} from "./utils/language";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Ma'lumotlar bazasiga ulanildi");

    bot.use(createConversation(addExpenseConversation));
    bot.use(createConversation(addIncomeConversation));

    bot.callbackQuery(/^set_lang:/, async (ctx) => {
      const lang = ctx.callbackQuery.data.split(":")[1];
      if (ctx.from) {
        await setUserLanguage(ctx.from.id, lang);
        await findOrCreateUser(ctx.from.id, ctx.from.username, lang);
      }
      const userIsAdmin = ctx.from ? ADMIN_IDS.includes(ctx.from.id) : false;
      await ctx.editMessageText(t(lang, "language_selected"), { parse_mode: "HTML" });
      await ctx.reply(t(lang, "welcome"), {
        reply_markup: getMainKeyboard(lang, userIsAdmin),
        parse_mode: "HTML",
      });
    });

    bot.command("start", async (ctx) => {
      if (!ctx.from) return;
      const existingLang = await getUserLanguage(ctx.from.id);
      if (!existingLang) {
        await ctx.reply("🌐 Tilni tanlang / Выберите язык / Choose language:", {
          reply_markup: getLanguageKeyboard(),
        });
        return;
      }
      const lang = existingLang;
      await findOrCreateUser(ctx.from.id, ctx.from.username, lang);
      const { isSubscribed, missingChannels: channels } = await checkUserSubscription(ctx.from.id);
      if (!isSubscribed && channels.length > 0) {
        await ctx.reply(t(lang, "subscribe_required"), {
          reply_markup: getSubscriptionKeyboard(lang, channels),
          parse_mode: "HTML",
        });
        return;
      }
      const userIsAdmin = ADMIN_IDS.includes(ctx.from.id);
      await ctx.reply(t(lang, "welcome"), {
        reply_markup: getMainKeyboard(lang, userIsAdmin),
        parse_mode: "HTML",
      });
    });

    bot.hears([t("uz", "btn_language"), t("ru", "btn_language"), t("en", "btn_language")], async (ctx) => {
      await ctx.reply("🌐 Tilni tanlang / Выберите язык / Choose language:", {
        reply_markup: getLanguageKeyboard(),
      });
    });

    bot.callbackQuery("check_subscription", async (ctx) => {
      if (!ctx.from) return;
      const lang = await getLang(ctx);
      const { isSubscribed, missingChannels: channels } = await checkUserSubscription(ctx.from.id);
      if (isSubscribed) {
        const userIsAdmin = ADMIN_IDS.includes(ctx.from.id);
        await ctx.editMessageText(t(lang, "subscription_success"));
        await ctx.reply(t(lang, "welcome"), {
          reply_markup: getMainKeyboard(lang, userIsAdmin),
          parse_mode: "HTML",
        });
      } else {
        await ctx.answerCallbackQuery({ text: t(lang, "not_subscribed_yet"), show_alert: true });
      }
    });

    bot.hears([t("uz", "btn_add_expense"), t("ru", "btn_add_expense"), t("en", "btn_add_expense")], async (ctx) => {
      if (!ctx.from) return;
      const lang = await getLang(ctx);
      const { isSubscribed, missingChannels: channels } = await checkUserSubscription(ctx.from.id);
      if (!isSubscribed && channels.length > 0) {
        await ctx.reply(t(lang, "subscribe_required"), {
          reply_markup: getSubscriptionKeyboard(lang, channels),
          parse_mode: "HTML",
        });
        return;
      }
      await (ctx as MyContext).conversation.enter("addExpenseConversation");
    });

    bot.hears([t("uz", "btn_add_income"), t("ru", "btn_add_income"), t("en", "btn_add_income")], async (ctx) => {
      if (!ctx.from) return;
      const lang = await getLang(ctx);
      const { isSubscribed, missingChannels: channels } = await checkUserSubscription(ctx.from.id);
      if (!isSubscribed && channels.length > 0) {
        await ctx.reply(t(lang, "subscribe_required"), {
          reply_markup: getSubscriptionKeyboard(lang, channels),
          parse_mode: "HTML",
        });
        return;
      }
      await (ctx as MyContext).conversation.enter("addIncomeConversation");
    });

    bot.hears([t("uz", "btn_balance"), t("ru", "btn_balance"), t("en", "btn_balance")], async (ctx) => {
      if (!ctx.from) return;
      const lang = await getLang(ctx);
      const { isSubscribed, missingChannels: channels } = await checkUserSubscription(ctx.from.id);
      if (!isSubscribed && channels.length > 0) {
        await ctx.reply(t(lang, "subscribe_required"), {
          reply_markup: getSubscriptionKeyboard(lang, channels),
          parse_mode: "HTML",
        });
        return;
      }
      await balanceCommand(ctx);
    });

    bot.hears([t("uz", "btn_report"), t("ru", "btn_report"), t("en", "btn_report")], async (ctx) => {
      if (!ctx.from) return;
      const lang = await getLang(ctx);
      const { isSubscribed, missingChannels: channels } = await checkUserSubscription(ctx.from.id);
      if (!isSubscribed && channels.length > 0) {
        await ctx.reply(t(lang, "subscribe_required"), {
          reply_markup: getSubscriptionKeyboard(lang, channels),
          parse_mode: "HTML",
        });
        return;
      }
      await reportCommand(ctx);
    });

    bot.callbackQuery(/^report_/, async (ctx) => {
      await handleReportCallback(ctx);
    });

    bot.hears([t("uz", "btn_admin"), t("ru", "btn_admin"), t("en", "btn_admin")], async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await openAdminPanel(ctx);
    });

    bot.callbackQuery("admin_channels", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await openChannelsSection(ctx);
    });

    bot.callbackQuery("admin_add_channel", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await startAddChannel(ctx);
    });

    bot.callbackQuery(/^channel_type:/, async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await handleChannelType(ctx);
    });

    bot.callbackQuery("admin_list_channels", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await showChannelsList(ctx);
    });

    bot.callbackQuery(/^toggle_channel:/, async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await handleToggleChannel(ctx);
    });

    bot.callbackQuery(/^delete_channel:/, async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await handleDeleteChannel(ctx);
    });

    bot.callbackQuery("admin_broadcast", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await openBroadcastSection(ctx);
    });

    bot.callbackQuery("broadcast_all", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await startBroadcast(ctx);
    });

    bot.callbackQuery("confirm_broadcast", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await confirmBroadcast(ctx);
    });

    bot.callbackQuery("admin_stats", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await showStatistics(ctx);
    });

    bot.callbackQuery("admin_back", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await openAdminPanel(ctx);
    });

    bot.callbackQuery("admin_cancel", async (ctx) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) return;
      await cancelAdminAction(ctx);
      await openAdminPanel(ctx);
    });

    bot.on("message:text", async (ctx, next) => {
      if (!ctx.from || !isAdmin(ctx.from.id)) {
        await next();
        return;
      }
      const state = getAdminState(ctx.from.id);
      if (state === AdminState.WAITING_CHANNEL_ID) {
        await handleChannelId(ctx);
        return;
      }
      if (state === AdminState.WAITING_CHANNEL_TITLE) {
        await handleChannelTitle(ctx);
        return;
      }
      if (state === AdminState.WAITING_CHANNEL_URL) {
        await handleChannelUrl(ctx);
        return;
      }
      if (state === AdminState.WAITING_BROADCAST_MESSAGE) {
        await handleBroadcastMessage(ctx);
        return;
      }
      await next();
    });

    bot.catch((err) => {
      console.error("Bot xatosi:", err);
    });

    console.log("🤖 Bot ishga tushmoqda...");
    await bot.start();
  } catch (error) {
    console.error("❌ Xatolik:", error);
    process.exit(1);
  }
}

main();
