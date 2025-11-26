import type { MyContext } from "../index";
import { findOrCreateUser } from "../../services/user.service";
import { calculateBalance } from "../../services/balance.service";
import { formatBalance } from "../../utils/format";

export async function balanceCommand(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply("❌ Foydalanuvchi aniqlanmadi.");
    return;
  }

  const user = await findOrCreateUser(telegramId);
  const { totalIncome, totalExpense } = await calculateBalance(user.id);

  await ctx.reply(formatBalance(totalIncome, totalExpense), {
    parse_mode: "Markdown",
  });
}
