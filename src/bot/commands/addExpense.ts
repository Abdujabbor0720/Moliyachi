import type { MyContext, MyConversation } from "../index";
import { findOrCreateUser } from "../../services/user.service";
import { createExpense, sumByPeriod } from "../../services/expense.service";
import { DEFAULT_EXPENSE_LIMIT, PERIODS } from "../../utils/constants";
import { formatLimitWarning } from "../../utils/format";

export async function addExpenseConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply("❌ Foydalanuvchi aniqlanmadi.");
    return;
  }

  // Xarajat nomi
  await ctx.reply("📝 Xarajat nomini kiriting:");
  const titleCtx = await conversation.wait();
  const title = titleCtx.message?.text?.trim();

  if (!title) {
    await ctx.reply(
      "❌ Xarajat nomi bo'sh bo'lmasligi kerak. Qaytadan /add_expense buyrug'ini yuboring."
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

  // Kategoriya
  await ctx.reply(
    "📂 Kategoriyani kiriting (masalan: oziq-ovqat, transport, ko'ngilochar, boshqa):"
  );
  const categoryCtx = await conversation.wait();
  const category = categoryCtx.message?.text?.trim();

  if (!category) {
    await ctx.reply(
      "❌ Kategoriya bo'sh bo'lmasligi kerak. Qaytadan /add_expense buyrug'ini yuboring."
    );
    return;
  }

  // Saqlash
  const user = await findOrCreateUser(telegramId);
  await createExpense(user.id, title, amount, category);

  await ctx.reply(
    `✅ Xarajat saqlandi!\n\n📝 Nomi: ${title}\n💵 Summa: ${amount.toLocaleString(
      "uz-UZ"
    )} so'm\n📂 Kategoriya: ${category}`
  );

  // Limit tekshirish
  const currentMonthExpense = await sumByPeriod(user.id, PERIODS.MONTHLY);
  if (currentMonthExpense > DEFAULT_EXPENSE_LIMIT) {
    await ctx.reply(
      formatLimitWarning(currentMonthExpense, DEFAULT_EXPENSE_LIMIT),
      {
        parse_mode: "Markdown",
      }
    );
  }
}
