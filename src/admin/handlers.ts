import type { MyContext } from "../bot/index";
import { ADMIN_IDS, AdminState } from "./types";
import {
  adminMainKeyboard,
  channelsKeyboard,
  channelTypeKeyboard,
  broadcastKeyboard,
  confirmKeyboard,
  cancelKeyboard,
  createChannelsInlineKeyboard,
} from "./keyboards";
import {
  addRequiredChannel,
  removeRequiredChannel,
  toggleChannelStatus,
  getAllChannels,
  getChannelById,
} from "../services/channel.service";
import {
  getAllUsers,
  getUsersCount,
  getActiveUsersCount,
} from "../services/user.service";
import { bot } from "../bot/index";

// Admin holati saqlash (oddiy in-memory)
const adminStates: Map<number, { state: AdminState; data?: any }> = new Map();

// Admin ekanligini tekshirish
export function isAdmin(userId: number): boolean {
  return ADMIN_IDS.includes(userId);
}

// Admin holatini olish
export function getAdminState(userId: number): {
  state: AdminState;
  data?: any;
} {
  return adminStates.get(userId) || { state: AdminState.IDLE };
}

// Admin holatini o'rnatish
export function setAdminState(
  userId: number,
  state: AdminState,
  data?: any
): void {
  adminStates.set(userId, { state, data });
}

// Admin holatini tozalash
export function clearAdminState(userId: number): void {
  adminStates.delete(userId);
}

// Admin panel ochish
export async function openAdminPanel(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) {
    await ctx.reply("⛔ Sizda admin huquqi yo'q!");
    return;
  }

  clearAdminState(ctx.from.id);

  await ctx.reply(
    `🔐 *Admin Panel*\n\nXush kelibsiz, admin!\nQuyidagi bo'limlardan birini tanlang:`,
    { parse_mode: "Markdown", reply_markup: adminMainKeyboard }
  );
}

// Majburiy kanallar bo'limi
export async function openChannelsSection(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  clearAdminState(ctx.from.id);

  await ctx.reply(
    `📢 *Majburiy kanallar bo'limi*\n\nBu yerda foydalanuvchilar uchun majburiy obuna kanallarini boshqarishingiz mumkin.`,
    { parse_mode: "Markdown", reply_markup: channelsKeyboard }
  );
}

// Kanal qo'shishni boshlash
export async function startAddChannel(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  setAdminState(ctx.from.id, AdminState.ADDING_CHANNEL, { step: "type" });

  await ctx.reply(`➕ *Yangi kanal qo'shish*\n\nKanal turini tanlang:`, {
    parse_mode: "Markdown",
    reply_markup: channelTypeKeyboard,
  });
}

// Kanal turini tanlash
export async function handleChannelType(
  ctx: MyContext,
  type: string
): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  let channelType: "channel" | "group" | "bot";

  if (type === "📢 Kanal") channelType = "channel";
  else if (type === "👥 Guruh") channelType = "group";
  else if (type === "🤖 Bot") channelType = "bot";
  else return;

  setAdminState(ctx.from.id, AdminState.ADDING_CHANNEL, {
    step: "id",
    type: channelType,
  });

  const example =
    channelType === "bot" ? "@username" : "@username yoki -100123456789";

  await ctx.reply(`📝 *${type} ID/username kiriting*\n\nMisol: ${example}`, {
    parse_mode: "Markdown",
    reply_markup: cancelKeyboard,
  });
}

// Kanal ID ni qabul qilish
export async function handleChannelId(
  ctx: MyContext,
  channelId: string
): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const state = getAdminState(ctx.from.id);
  if (state.state !== AdminState.ADDING_CHANNEL || state.data?.step !== "id")
    return;

  setAdminState(ctx.from.id, AdminState.ADDING_CHANNEL, {
    ...state.data,
    step: "title",
    channelId,
  });

  await ctx.reply(
    `📝 *Kanal nomini kiriting*\n\nBu nom foydalanuvchilarga ko'rsatiladi.`,
    { parse_mode: "Markdown", reply_markup: cancelKeyboard }
  );
}

// Kanal nomini qabul qilish
export async function handleChannelTitle(
  ctx: MyContext,
  title: string
): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const state = getAdminState(ctx.from.id);
  if (state.state !== AdminState.ADDING_CHANNEL || state.data?.step !== "title")
    return;

  setAdminState(ctx.from.id, AdminState.ADDING_CHANNEL, {
    ...state.data,
    step: "url",
    title,
  });

  await ctx.reply(
    `🔗 *Kanal havolasini kiriting*\n\nMisol: https://t.me/channelname`,
    { parse_mode: "Markdown", reply_markup: cancelKeyboard }
  );
}

// Kanal URL ni qabul qilish va saqlash
export async function handleChannelUrl(
  ctx: MyContext,
  url: string
): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const state = getAdminState(ctx.from.id);
  if (state.state !== AdminState.ADDING_CHANNEL || state.data?.step !== "url")
    return;

  const { channelId, title, type } = state.data;

  try {
    await addRequiredChannel(channelId, title, url, type);
    clearAdminState(ctx.from.id);

    await ctx.reply(
      `✅ *Kanal muvaffaqiyatli qo'shildi!*\n\n📢 Nomi: ${title}\n🆔 ID: ${channelId}\n🔗 Havola: ${url}`,
      { parse_mode: "Markdown", reply_markup: channelsKeyboard }
    );
  } catch (error) {
    await ctx.reply(`❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.`, {
      reply_markup: channelsKeyboard,
    });
  }
}

// Kanallar ro'yxati
export async function showChannelsList(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const channels = await getAllChannels();

  if (channels.length === 0) {
    await ctx.reply(
      `📋 *Kanallar ro'yxati*\n\nHozircha hech qanday kanal qo'shilmagan.`,
      { parse_mode: "Markdown", reply_markup: channelsKeyboard }
    );
    return;
  }

  const keyboard = createChannelsInlineKeyboard(channels);

  await ctx.reply(
    `📋 *Kanallar ro'yxati*\n\n✅ - Faol\n❌ - Nofaol\n\nHolatni o'zgartirish uchun kanal nomini bosing.\nO'chirish uchun 🗑 tugmasini bosing.`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
}

// Kanal holatini o'zgartirish callback
export async function handleToggleChannel(
  ctx: MyContext,
  channelDbId: string
): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const channel = await toggleChannelStatus(channelDbId);

  if (channel) {
    await ctx.answerCallbackQuery({
      text: `${channel.title} - ${
        channel.isActive ? "Faollashtirildi ✅" : "O'chirildi ❌"
      }`,
    });

    // Ro'yxatni yangilash
    const channels = await getAllChannels();
    const keyboard = createChannelsInlineKeyboard(channels);

    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
  }
}

// Kanalni o'chirish callback
export async function handleDeleteChannel(
  ctx: MyContext,
  channelDbId: string
): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const channel = await getChannelById(channelDbId);
  if (!channel) {
    await ctx.answerCallbackQuery({ text: "Kanal topilmadi!" });
    return;
  }

  await removeRequiredChannel(channel.channelId);
  await ctx.answerCallbackQuery({ text: `${channel.title} o'chirildi!` });

  // Ro'yxatni yangilash
  const channels = await getAllChannels();

  if (channels.length === 0) {
    await ctx.editMessageText(
      `📋 *Kanallar ro'yxati*\n\nHozircha hech qanday kanal qo'shilmagan.`,
      { parse_mode: "Markdown" }
    );
  } else {
    const keyboard = createChannelsInlineKeyboard(channels);
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
  }
}

// Xabar yuborish bo'limi
export async function openBroadcastSection(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  clearAdminState(ctx.from.id);

  await ctx.reply(
    `📨 *Xabar yuborish bo'limi*\n\nBu yerda barcha foydalanuvchilarga xabar yuborishingiz mumkin.`,
    { parse_mode: "Markdown", reply_markup: broadcastKeyboard }
  );
}

// Xabar yozishni boshlash
export async function startBroadcast(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  setAdminState(ctx.from.id, AdminState.BROADCASTING);

  await ctx.reply(
    `📝 *Xabar yozing*\n\nYubormoqchi bo'lgan xabaringizni yozing.\nMatn, rasm, video yoki boshqa media yuborishingiz mumkin.`,
    { parse_mode: "Markdown", reply_markup: cancelKeyboard }
  );
}

// Xabarni qabul qilish
export async function handleBroadcastMessage(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const state = getAdminState(ctx.from.id);
  if (state.state !== AdminState.BROADCASTING) return;

  const usersCount = await getActiveUsersCount();

  setAdminState(ctx.from.id, AdminState.WAITING_BROADCAST_CONFIRM, {
    messageId: ctx.message?.message_id,
    chatId: ctx.chat?.id,
  });

  await ctx.reply(
    `📨 *Xabarni tasdiqlang*\n\nBu xabar ${usersCount} ta foydalanuvchiga yuboriladi.\n\nDavom etasizmi?`,
    { parse_mode: "Markdown", reply_markup: confirmKeyboard }
  );
}

// Xabarni tasdiqlash va yuborish
export async function confirmBroadcast(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const state = getAdminState(ctx.from.id);
  if (state.state !== AdminState.WAITING_BROADCAST_CONFIRM) return;

  const { messageId, chatId } = state.data;

  clearAdminState(ctx.from.id);

  await ctx.reply(`⏳ Xabarlar yuborilmoqda...`, {
    reply_markup: adminMainKeyboard,
  });

  const users = await getAllUsers();
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await bot.api.copyMessage(user.telegramId, chatId, messageId);
      sent++;
      // Rate limit uchun kichik kutish
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      failed++;
    }
  }

  await ctx.reply(
    `✅ *Xabar yuborish tugadi!*\n\n📤 Yuborildi: ${sent}\n❌ Xatolik: ${failed}`,
    { parse_mode: "Markdown", reply_markup: adminMainKeyboard }
  );
}

// Statistika
export async function showStatistics(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const totalUsers = await getUsersCount();
  const activeUsers = await getActiveUsersCount();
  const channels = await getAllChannels();
  const activeChannels = channels.filter((c) => c.isActive).length;

  await ctx.reply(
    `📊 *Statistika*\n\n👥 Jami foydalanuvchilar: ${totalUsers}\n✅ Faol foydalanuvchilar: ${activeUsers}\n📢 Jami kanallar: ${channels.length}\n🟢 Faol kanallar: ${activeChannels}`,
    { parse_mode: "Markdown", reply_markup: adminMainKeyboard }
  );
}

// Bekor qilish
export async function cancelAdminAction(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;

  const state = getAdminState(ctx.from.id);
  clearAdminState(ctx.from.id);

  if (state.state === AdminState.ADDING_CHANNEL) {
    await ctx.reply(`❌ Kanal qo'shish bekor qilindi.`, {
      reply_markup: channelsKeyboard,
    });
  } else if (
    state.state === AdminState.BROADCASTING ||
    state.state === AdminState.WAITING_BROADCAST_CONFIRM
  ) {
    await ctx.reply(`❌ Xabar yuborish bekor qilindi.`, {
      reply_markup: broadcastKeyboard,
    });
  } else {
    await ctx.reply(`❌ Bekor qilindi.`, { reply_markup: adminMainKeyboard });
  }
}
