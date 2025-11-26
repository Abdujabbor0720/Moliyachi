import { AppDataSource } from "../db/dataSource";
import { Expense } from "../db/entities/Expense";
import { MoreThanOrEqual } from "typeorm";

const expenseRepository = AppDataSource.getRepository(Expense);

export async function createExpense(
  userId: string,
  title: string,
  amount: number,
  category: string
): Promise<Expense> {
  const expense = expenseRepository.create({
    userId,
    title,
    amount,
    category,
  });
  return expenseRepository.save(expense);
}

export async function sumByPeriod(
  userId: string,
  days: number
): Promise<number> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const result = await expenseRepository
    .createQueryBuilder("expense")
    .select("COALESCE(SUM(expense.amount), 0)", "total")
    .where("expense.userId = :userId", { userId })
    .andWhere("expense.createdAt >= :dateFrom", { dateFrom })
    .getRawOne();

  return parseFloat(result?.total || "0");
}

export async function sumByCategory(
  userId: string,
  days: number
): Promise<{ category: string; total: number }[]> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const result = await expenseRepository
    .createQueryBuilder("expense")
    .select("expense.category", "category")
    .addSelect("SUM(expense.amount)", "total")
    .where("expense.userId = :userId", { userId })
    .andWhere("expense.createdAt >= :dateFrom", { dateFrom })
    .groupBy("expense.category")
    .orderBy("total", "DESC")
    .getRawMany();

  return result.map((r) => ({
    category: r.category,
    total: parseFloat(r.total),
  }));
}

export async function getTotalExpenses(userId: string): Promise<number> {
  const result = await expenseRepository
    .createQueryBuilder("expense")
    .select("COALESCE(SUM(expense.amount), 0)", "total")
    .where("expense.userId = :userId", { userId })
    .getRawOne();

  return parseFloat(result?.total || "0");
}
