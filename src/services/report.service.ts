import {
  sumByPeriod as sumExpensesByPeriod,
  sumByCategory,
} from "./expense.service";
import { sumByPeriod as sumIncomesByPeriod } from "./income.service";
import { PERIODS } from "../utils/constants";

export interface ReportResult {
  periodName: string;
  categoryExpenses: { category: string; total: number }[];
  totalIncome: number;
  totalExpense: number;
}

export async function weeklyReport(userId: string): Promise<ReportResult> {
  const days = PERIODS.WEEKLY;

  const [categoryExpenses, totalExpense, totalIncome] = await Promise.all([
    sumByCategory(userId, days),
    sumExpensesByPeriod(userId, days),
    sumIncomesByPeriod(userId, days),
  ]);

  return {
    periodName: "Haftalik",
    categoryExpenses,
    totalIncome,
    totalExpense,
  };
}

export async function monthlyReport(userId: string): Promise<ReportResult> {
  const days = PERIODS.MONTHLY;

  const [categoryExpenses, totalExpense, totalIncome] = await Promise.all([
    sumByCategory(userId, days),
    sumExpensesByPeriod(userId, days),
    sumIncomesByPeriod(userId, days),
  ]);

  return {
    periodName: "Oylik",
    categoryExpenses,
    totalIncome,
    totalExpense,
  };
}
