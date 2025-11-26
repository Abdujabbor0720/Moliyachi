export function formatNumber(num: number): string {
  return num.toLocaleString("uz-UZ");
}

export function formatBalance(
  totalIncome: number,
  totalExpense: number
): string {
  const balance = totalIncome - totalExpense;
  return `
💰 *Balans hisoboti*

📈 Umumiy daromad: *${formatNumber(totalIncome)}* so'm
📉 Umumiy xarajat: *${formatNumber(totalExpense)}* so'm
━━━━━━━━━━━━━━━━━
💵 Sof balans: *${formatNumber(balance)}* so'm
`;
}

export function formatReport(
  periodName: string,
  categoryExpenses: { category: string; total: number }[],
  totalIncome: number,
  totalExpense: number
): string {
  const balance = totalIncome - totalExpense;

  let categoryReport = "";
  if (categoryExpenses.length > 0) {
    categoryReport = categoryExpenses
      .map((c) => {
        const percent =
          totalExpense > 0 ? ((c.total / totalExpense) * 100).toFixed(1) : "0";
        return `   • ${c.category}: ${formatNumber(
          c.total
        )} so'm (${percent}%)`;
      })
      .join("\n");
  } else {
    categoryReport = "   Xarajatlar mavjud emas";
  }

  return `
📊 *${periodName} hisobot*

📋 *Xarajatlar kategoriyalar bo'yicha:*
${categoryReport}

━━━━━━━━━━━━━━━━━
📈 Umumiy daromad: *${formatNumber(totalIncome)}* so'm
📉 Umumiy xarajat: *${formatNumber(totalExpense)}* so'm
💵 Sof balans: *${formatNumber(balance)}* so'm
`;
}

export function formatLimitWarning(
  currentExpense: number,
  limit: number
): string {
  return `
⚠️ *Diqqat! Xarajat limiti oshdi!*

Sizning joriy xarajatlaringiz: *${formatNumber(currentExpense)}* so'm
Belgilangan limit: *${formatNumber(limit)}* so'm

Iltimos, xarajatlaringizni nazorat qiling!
`;
}
