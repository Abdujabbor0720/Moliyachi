import { bot } from "../bot/index";
import { getActiveChannels } from "../services/channel.service";
import type { MyContext } from "../bot/index";

// Foydalanuvchi barcha kanallarga obuna bo'lganmi tekshirish
export async function checkUserSubscription(userId: number): Promise<{
  isSubscribed: boolean;
  missingChannels: { url: string; title: string }[];
}> {
  const channels = await getActiveChannels();
  const missingChannels: { url: string; title: string }[] = [];

  // Agar aktiv kanallar yo'q bo'lsa, obuna talab qilinmaydi
  if (channels.length === 0) {
    return { isSubscribed: true, missingChannels: [] };
  }

  for (const channel of channels) {
    try {
      let chatId = channel.channelId;

      // Agar @ bilan boshlanmasa va raqam bo'lmasa, @ qo'shamiz
      if (!chatId.startsWith("@") && !chatId.startsWith("-")) {
        chatId = `@${chatId}`;
      }

      const member = await bot.api.getChatMember(chatId, userId);

      // Foydalanuvchi a'zo emasmi tekshirish
      // left - chiqib ketgan, kicked - bloklangan
      if (["left", "kicked"].includes(member.status)) {
        missingChannels.push({
          url: channel.url,
          title: channel.title,
        });
      }
      // member, administrator, creator - a'zo hisoblanadi
    } catch (error: any) {
      // Xatolik bo'lsa - foydalanuvchi kanalda yo'q deb hisoblaymiz
      // Bu holat: bot admin emas, kanal topilmadi, yoki foydalanuvchi a'zo emas
      console.log(
        `Kanal tekshirishda xatolik (${channel.channelId}): ${
          error.description || error.message
        }`
      );

      // Xatolik bo'lganda ham kanalga obuna bo'lishni talab qilamiz
      missingChannels.push({
        url: channel.url,
        title: channel.title,
      });
    }
  }

  return {
    isSubscribed: missingChannels.length === 0,
    missingChannels,
  };
}

// Obuna tekshirish middleware
export async function subscriptionMiddleware(
  ctx: MyContext,
  next: () => Promise<void>
): Promise<void> {
  // Admin tekshiruvidan o'tkazmaymiz
  const { ADMIN_IDS } = await import("./types");
  if (ctx.from && ADMIN_IDS.includes(ctx.from.id)) {
    return next();
  }

  // Callback query uchun subscription check
  if (ctx.callbackQuery?.data === "check_subscription") {
    return next();
  }

  // Foydalanuvchi ID sini olish
  const userId = ctx.from?.id;
  if (!userId) {
    return next();
  }

  // Obuna tekshirish
  const { isSubscribed, missingChannels } = await checkUserSubscription(userId);

  if (!isSubscribed && missingChannels.length > 0) {
    const { createSubscriptionKeyboard } = await import("./keyboards");

    await ctx.reply(
      `⚠️ *Botdan foydalanish uchun quyidagi kanallarga obuna bo'ling:*\n\nObuna bo'lgandan so'ng "✅ Tekshirish" tugmasini bosing.`,
      {
        parse_mode: "Markdown",
        reply_markup: createSubscriptionKeyboard(missingChannels),
      }
    );
    return;
  }

  return next();
}
