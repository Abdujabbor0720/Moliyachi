import { AppDataSource } from "../db/dataSource";
import { Income } from "../db/entities/Income";

const incomeRepository = AppDataSource.getRepository(Income);

export async function createIncome(
  userId: string,
  source: string,
  amount: number
): Promise<Income> {
  const income = incomeRepository.create({
    userId,
    source,
    amount,
  });
  return incomeRepository.save(income);
}

export async function sumByPeriod(
  userId: string,
  days: number
): Promise<number> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const result = await incomeRepository
    .createQueryBuilder("income")
    .select("COALESCE(SUM(income.amount), 0)", "total")
    .where("income.userId = :userId", { userId })
    .andWhere("income.createdAt >= :dateFrom", { dateFrom })
    .getRawOne();

  return parseFloat(result?.total || "0");
}

export async function getTotalIncomes(userId: string): Promise<number> {
  const result = await incomeRepository
    .createQueryBuilder("income")
    .select("COALESCE(SUM(income.amount), 0)", "total")
    .where("income.userId = :userId", { userId })
    .getRawOne();

  return parseFloat(result?.total || "0");
}
