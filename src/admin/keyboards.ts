import { Keyboard, InlineKeyboard } from "grammy";

// Admin asosiy menyu
export const adminMainKeyboard = new Keyboard()
  .text("📢 Majburiy kanallar")
  .text("📨 Xabar yuborish")
  .row()
  .text("📊 Statistika")
  .text("👥 Foydalanuvchilar")
  .row()
  .text("🔙 Botga qaytish")
  .resized()
  .persistent();

// Majburiy kanallar menyusi
export const channelsKeyboard = new Keyboard()
  .text("➕ Kanal qo'shish")
  .text("📋 Kanallar ro'yxati")
  .row()
  .text("🔙 Admin panelga qaytish")
  .resized()
  .persistent();

// Kanal turi tanlash
export const channelTypeKeyboard = new Keyboard()
  .text("📢 Kanal")
  .text("👥 Guruh")
  .row()
  .text("🤖 Bot")
  .row()
  .text("❌ Bekor qilish")
  .resized();

// Xabar yuborish menyusi
export const broadcastKeyboard = new Keyboard()
  .text("📝 Xabar yozish")
  .row()
  .text("🔙 Admin panelga qaytish")
  .resized()
  .persistent();

// Tasdiqlash
export const confirmKeyboard = new Keyboard()
  .text("✅ Tasdiqlash")
  .text("❌ Bekor qilish")
  .resized();

// Bekor qilish
export const cancelKeyboard = new Keyboard().text("❌ Bekor qilish").resized();

// Kanallar uchun inline keyboard yaratish
export function createChannelsInlineKeyboard(
  channels: {
    id: string;
    channelId: string;
    title: string;
    isActive: boolean;
  }[]
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const channel of channels) {
    const status = channel.isActive ? "✅" : "❌";
    keyboard
      .text(`${status} ${channel.title}`, `toggle_channel:${channel.id}`)
      .text("🗑", `delete_channel:${channel.id}`)
      .row();
  }

  return keyboard;
}

// Obuna tekshirish tugmasi
export function createSubscriptionKeyboard(
  channels: { url: string; title: string }[]
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const channel of channels) {
    keyboard.url(`📢 ${channel.title}`, channel.url).row();
  }

  keyboard.text("✅ Tekshirish", "check_subscription");

  return keyboard;
}
