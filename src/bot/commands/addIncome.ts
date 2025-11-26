import type { MyContext, MyConversation } from "../index";
import { findOrCreateUser } from "../../services/user.service";
import { createIncome } from "../../services/income.service";

export async function addIncomeConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply("❌ Foydalanuvchi aniqlanmadi.");
    return;
  }

  // Manba
  await ctx.reply(
    "📋 Daromad manbasini kiriting (masalan: ish haqi, qo'shimcha ish, sovg'a):"
  );
  const sourceCtx = await conversation.wait();
  const source = sourceCtx.message?.text?.trim();

  if (!source) {
    await ctx.reply(
      "❌ Manba bo'sh bo'lmasligi kerak. Qaytadan /add_income buyrug'ini yuboring."
    );
    return;
  }

  // Summa
  await ctx.reply("💵 Summani kiriting (faqat raqam):");
  let amount: number = 0;

  while (true) {
    const amountCtx = await conversation.wait();
    const amountText = amountCtx.message?.text?.trim();
    const parsed = parseFloat(amountText || "");

    if (isNaN(parsed) || parsed <= 0) {
      await ctx.reply("❌ Noto'g'ri summa. Iltimos, musbat raqam kiriting:");
      continue;
    }

    amount = parsed;
    break;
  }

  // Saqlash
  const user = await findOrCreateUser(telegramId);
  await createIncome(user.id, source, amount);

  await ctx.reply(
    `✅ Daromad saqlandi!\n\n📋 Manba: ${source}\n💵 Summa: ${amount.toLocaleString(
      "uz-UZ"
    )} so'm`
  );
}
