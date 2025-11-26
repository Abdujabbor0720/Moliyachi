import * as dotenv from "dotenv";
dotenv.config();

// Admin Telegram ID lari (.env dan yoki qo'lda qo'shing)
const adminIdsFromEnv =
  process.env.ADMIN_IDS?.split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id)) || [];

export const ADMIN_IDS: number[] = [
  ...adminIdsFromEnv,
  // Qo'shimcha adminlar qo'shish mumkin
];

// Majburiy obuna sozlamalari
export interface RequiredChannel {
  id: string; // Kanal/guruh username yoki ID (-100...)
  title: string; // Ko'rsatiladigan nom
  url: string; // Havola
  type: "channel" | "group" | "bot"; // Turi
  isActive: boolean; // Faolmi
}

// Admin panel holatlari
export enum AdminState {
  IDLE = "idle",
  ADDING_CHANNEL = "adding_channel",
  BROADCASTING = "broadcasting",
  WAITING_BROADCAST_CONFIRM = "waiting_broadcast_confirm",
}
