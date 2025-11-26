import { getTotalExpenses } from "./expense.service";
import { getTotalIncomes } from "./income.service";

export interface BalanceResult {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export async function calculateBalance(userId: string): Promise<BalanceResult> {
  const totalIncome = await getTotalIncomes(userId);
  const totalExpense = await getTotalExpenses(userId);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}
