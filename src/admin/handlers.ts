import { InlineKeyboard } from "grammy";
import type { MyContext } from "../bot/index";
import { bot } from "../bot/index";
import { AppDataSource } from "../db/dataSource";
import { RequiredChannel } from "../db/entities/RequiredChannel";
import { User } from "../db/entities/User";
import { AdminState, ADMIN_IDS, ChannelType } from "./types";
import { t, getLang } from "../utils/language";

const adminStates = new Map<number, AdminState>();
const adminData = new Map<number, Record<string, string>>();

export function isAdmin(userId: number): boolean {
  return ADMIN_IDS.includes(userId);
}

export function getAdminState(userId: number): AdminState {
  return adminStates.get(userId) || AdminState.IDLE;
}

export function setAdminState(userId: number, state: AdminState): void {
  adminStates.set(userId, state);
}

export function getAdminData(userId: number): Record<string, string> {
  return adminData.get(userId) || {};
}

export function setAdminData(userId: number, data: Record<string, string>): void {
  adminData.set(userId, data);
}

export function clearAdminState(userId: number): void {
  adminStates.delete(userId);
  adminData.delete(userId);
}

export async function openAdminPanel(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  const keyboard = new InlineKeyboard()
    .text(t(lang, "admin_btn_channels"), "admin_channels")
    .row()
    .text(t(lang, "admin_btn_broadcast"), "admin_broadcast")
    .row()
    .text(t(lang, "admin_btn_statistics"), "admin_stats");
  const text = t(lang, "admin_panel");
  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: "HTML" });
  } else {
    await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
  }
}

export async function openChannelsSection(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  const keyboard = new InlineKeyboard()
    .text(t(lang, "admin_add_channel"), "admin_add_channel")
    .row()
    .text(t(lang, "admin_list_channels"), "admin_list_channels")
    .row()
    .text(t(lang, "admin_back"), "admin_back");
  await ctx.editMessageText(t(lang, "admin_channels_section"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function startAddChannel(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  const keyboard = new InlineKeyboard()
    .text(t(lang, "channel_type_channel"), "channel_type:" + ChannelType.CHANNEL)
    .row()
    .text(t(lang, "channel_type_group"), "channel_type:" + ChannelType.GROUP)
    .row()
    .text(t(lang, "admin_cancel"), "admin_cancel");
  await ctx.editMessageText(t(lang, "select_channel_type"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function handleChannelType(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id) || !ctx.callbackQuery) return;
  const lang = await getLang(ctx);
  const type = ctx.callbackQuery.data?.split(":")[1] as ChannelType;
  setAdminData(ctx.from.id, { type });
  setAdminState(ctx.from.id, AdminState.WAITING_CHANNEL_ID);
  const keyboard = new InlineKeyboard().text(t(lang, "admin_cancel"), "admin_cancel");
  await ctx.editMessageText(t(lang, "enter_channel_id"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function handleChannelId(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id) || !ctx.message?.text) return;
  const lang = await getLang(ctx);
  const channelId = ctx.message.text.trim();
  const data = getAdminData(ctx.from.id);
  data.channelId = channelId;
  setAdminData(ctx.from.id, data);
  setAdminState(ctx.from.id, AdminState.WAITING_CHANNEL_TITLE);
  const keyboard = new InlineKeyboard().text(t(lang, "admin_cancel"), "admin_cancel");
  await ctx.reply(t(lang, "enter_channel_title"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function handleChannelTitle(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id) || !ctx.message?.text) return;
  const lang = await getLang(ctx);
  const title = ctx.message.text.trim();
  const data = getAdminData(ctx.from.id);
  data.title = title;
  setAdminData(ctx.from.id, data);
  setAdminState(ctx.from.id, AdminState.WAITING_CHANNEL_URL);
  const keyboard = new InlineKeyboard().text(t(lang, "admin_cancel"), "admin_cancel");
  await ctx.reply(t(lang, "enter_channel_url"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function handleChannelUrl(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id) || !ctx.message?.text) return;
  const lang = await getLang(ctx);
  const url = ctx.message.text.trim();
  const data = getAdminData(ctx.from.id);
  const channelRepo = AppDataSource.getRepository(RequiredChannel);
  const channel = channelRepo.create({
    channelId: data.channelId,
    title: data.title,
    url: url,
    type: data.type as ChannelType,
    isActive: true,
  });
  await channelRepo.save(channel);
  clearAdminState(ctx.from.id);
  const keyboard = new InlineKeyboard().text(t(lang, "admin_back"), "admin_back");
  await ctx.reply(t(lang, "channel_added"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function showChannelsList(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  const channelRepo = AppDataSource.getRepository(RequiredChannel);
  const channels = await channelRepo.find();
  if (channels.length === 0) {
    const keyboard = new InlineKeyboard().text(t(lang, "admin_back"), "admin_back");
    await ctx.editMessageText(t(lang, "no_channels"), { reply_markup: keyboard, parse_mode: "HTML" });
    return;
  }
  const keyboard = new InlineKeyboard();
  channels.forEach((channel) => {
    const status = channel.isActive ? "✅" : "❌";
    keyboard.text(status + " " + channel.title, "toggle_channel:" + channel.id);
    keyboard.text("🗑", "delete_channel:" + channel.id);
    keyboard.row();
  });
  keyboard.text(t(lang, "admin_back"), "admin_back");
  await ctx.editMessageText(t(lang, "channels_list"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function handleToggleChannel(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id) || !ctx.callbackQuery) return;
  const channelId = ctx.callbackQuery.data?.split(":")[1] || "";
  const channelRepo = AppDataSource.getRepository(RequiredChannel);
  const channel = await channelRepo.findOne({ where: { id: channelId } });
  if (channel) {
    channel.isActive = !channel.isActive;
    await channelRepo.save(channel);
  }
  await showChannelsList(ctx);
}

export async function handleDeleteChannel(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id) || !ctx.callbackQuery) return;
  const channelId = ctx.callbackQuery.data?.split(":")[1] || "";
  const channelRepo = AppDataSource.getRepository(RequiredChannel);
  await channelRepo.delete(channelId);
  await showChannelsList(ctx);
}

export async function openBroadcastSection(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  const keyboard = new InlineKeyboard()
    .text(t(lang, "broadcast_all_users"), "broadcast_all")
    .row()
    .text(t(lang, "admin_back"), "admin_back");
  await ctx.editMessageText(t(lang, "admin_broadcast_section"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function startBroadcast(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  setAdminState(ctx.from.id, AdminState.WAITING_BROADCAST_MESSAGE);
  const keyboard = new InlineKeyboard().text(t(lang, "admin_cancel"), "admin_cancel");
  await ctx.editMessageText(t(lang, "enter_broadcast_message"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function handleBroadcastMessage(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id) || !ctx.message?.text) return;
  const lang = await getLang(ctx);
  const message = ctx.message.text;
  setAdminData(ctx.from.id, { broadcastMessage: message });
  setAdminState(ctx.from.id, AdminState.CONFIRMING_BROADCAST);
  const keyboard = new InlineKeyboard()
    .text(t(lang, "confirm_broadcast"), "confirm_broadcast")
    .row()
    .text(t(lang, "admin_cancel"), "admin_cancel");
  await ctx.reply(t(lang, "broadcast_preview") + "\n\n" + message + "\n\n" + t(lang, "confirm_broadcast_question"), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function confirmBroadcast(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  const data = getAdminData(ctx.from.id);
  const message = data.broadcastMessage;
  if (!message) {
    await ctx.answerCallbackQuery({ text: t(lang, "no_message"), show_alert: true });
    return;
  }
  await ctx.editMessageText(t(lang, "sending_broadcast"));
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find();
  let sent = 0;
  let failed = 0;
  for (const user of users) {
    try {
      await bot.api.sendMessage(user.telegramId, message);
      sent++;
    } catch {
      failed++;
    }
  }
  clearAdminState(ctx.from.id);
  const keyboard = new InlineKeyboard().text(t(lang, "admin_back"), "admin_back");
  await ctx.reply(t(lang, "broadcast_result", { sent: sent.toString(), failed: failed.toString() }), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function showStatistics(ctx: MyContext): Promise<void> {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const lang = await getLang(ctx);
  const userRepo = AppDataSource.getRepository(User);
  const totalUsers = await userRepo.count();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newUsersToday = await userRepo.createQueryBuilder("user").where("user.createdAt >= :today", { today }).getCount();
  const keyboard = new InlineKeyboard().text(t(lang, "admin_back"), "admin_back");
  await ctx.editMessageText(t(lang, "statistics", { total: totalUsers.toString(), today: newUsersToday.toString() }), { reply_markup: keyboard, parse_mode: "HTML" });
}

export async function cancelAdminAction(ctx: MyContext): Promise<void> {
  if (!ctx.from) return;
  clearAdminState(ctx.from.id);
}
