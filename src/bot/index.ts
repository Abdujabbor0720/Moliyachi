import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import type { Context, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import * as dotenv from "dotenv";

dotenv.config();

export interface SessionData {
  __language_code?: string;
}

type BaseContext = Context & SessionFlavor<SessionData>;
export type MyContext = BaseContext & ConversationFlavor<BaseContext>;
export type MyConversation = Conversation<MyContext, MyContext>;

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN muhit o'zgaruvchisi topilmadi!");
}

export const bot = new Bot<MyContext>(token);

// Session middleware
bot.use(
  session({
    initial: (): SessionData => ({
      __language_code: "uz",
    }),
  })
);

// Conversations middleware
bot.use(conversations());
