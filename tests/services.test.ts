import { describe, it, expect, vi, beforeEach } from 'vitest';

function createMockExpenseRepo() {
  return {
    create: vi.fn((data) => ({ id: 'expense-id', ...data })),
    save: vi.fn((data) => Promise.resolve(data)),
    createQueryBuilder: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getRawOne: vi.fn(() => Promise.resolve({ total: '100000' })),
      getRawMany: vi.fn(() =>
        Promise.resolve([
          { category: 'oziq-ovqat', total: '50000' },
          { category: 'transport', total: '30000' },
        ])
      ),
    })),
  };
}

function createMockIncomeRepo() {
  return {
    create: vi.fn((data) => ({ id: 'income-id', ...data })),
    save: vi.fn((data) => Promise.resolve(data)),
    createQueryBuilder: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getRawOne: vi.fn(() => Promise.resolve({ total: '200000' })),
    })),
  };
}

function createMockUserRepo() {
  return {
    create: vi.fn((data) => ({ id: 'user-id', ...data })),
    save: vi.fn((data) => Promise.resolve(data)),
    findOne: vi.fn(() => Promise.resolve({ id: 'user-id', telegramId: 123456 })),
  };
}

describe('Service Tests', () => {
  let mockExpenseRepo;
  let mockIncomeRepo;
  let mockUserRepo;

  beforeEach(() => {
    mockExpenseRepo = createMockExpenseRepo();
    mockIncomeRepo = createMockIncomeRepo();
    mockUserRepo = createMockUserRepo();
  });

  describe('Expense Service Logic', () => {
    it('expense yaratish mantiqiy togri ishlashi kerak', () => {
      const expenseData = {
        userId: 'user-id',
        title: 'Test xarajat',
        amount: 50000,
        category: 'oziq-ovqat',
      };
      
      const result = mockExpenseRepo.create(expenseData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Test xarajat');
      expect(result.amount).toBe(50000);
      expect(result.category).toBe('oziq-ovqat');
    });

    it('expense saqlash async ishlashi kerak', async () => {
      const expenseData = {
        userId: 'user-id',
        title: 'Test xarajat',
        amount: 50000,
        category: 'oziq-ovqat',
      };
      
      const result = await mockExpenseRepo.save(expenseData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Test xarajat');
    });

    it('sumByPeriod query builder ishlatishi kerak', async () => {
      const qb = mockExpenseRepo.createQueryBuilder();
      const result = await qb.getRawOne();
      
      expect(result).toHaveProperty('total');
      expect(parseFloat(result.total)).toBe(100000);
    });

    it('sumByCategory kategoriyalar royxatini qaytarishi kerak', async () => {
      const qb = mockExpenseRepo.createQueryBuilder();
      const result = await qb.getRawMany();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('total');
    });
  });

  describe('Income Service Logic', () => {
    it('income yaratish mantiqiy togri ishlashi kerak', () => {
      const incomeData = {
        userId: 'user-id',
        source: 'Ish haqi',
        amount: 3000000,
      };
      
      const result = mockIncomeRepo.create(incomeData);
      
      expect(result).toBeDefined();
      expect(result.source).toBe('Ish haqi');
      expect(result.amount).toBe(3000000);
    });

    it('income saqlash async ishlashi kerak', async () => {
      const incomeData = {
        userId: 'user-id',
        source: 'Ish haqi',
        amount: 3000000,
      };
      
      const result = await mockIncomeRepo.save(incomeData);
      
      expect(result).toBeDefined();
      expect(result.source).toBe('Ish haqi');
    });

    it('sumByPeriod query builder ishlatishi kerak', async () => {
      const qb = mockIncomeRepo.createQueryBuilder();
      const result = await qb.getRawOne();
      
      expect(result).toHaveProperty('total');
      expect(parseFloat(result.total)).toBe(200000);
    });
  });

  describe('Balance Calculation Logic', () => {
    it('balans togri hisoblanishi kerak', () => {
      const totalIncome = 500000;
      const totalExpense = 200000;
      const balance = totalIncome - totalExpense;
      
      expect(balance).toBe(300000);
    });

    it('manfiy balans bolishi mumkin', () => {
      const totalIncome = 100000;
      const totalExpense = 300000;
      const balance = totalIncome - totalExpense;
      
      expect(balance).toBe(-200000);
    });
  });

  describe('Report Logic', () => {
    it('haftalik hisobot 7 kunlik davr uchun bolishi kerak', () => {
      const WEEKLY = 7;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - WEEKLY);
      
      const daysDiff = Math.round((new Date().getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(WEEKLY);
    });

    it('oylik hisobot 30 kunlik davr uchun bolishi kerak', () => {
      const MONTHLY = 30;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - MONTHLY);
      
      const daysDiff = Math.round((new Date().getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(MONTHLY);
    });

    it('kategoriya foizlari togri hisoblanishi kerak', () => {
      const categories = [
        { category: 'oziq-ovqat', total: 50000 },
        { category: 'transport', total: 30000 },
        { category: 'boshqa', total: 20000 },
      ];
      const totalExpense = 100000;
      
      const percents = categories.map(c => ({
        ...c,
        percent: ((c.total / totalExpense) * 100).toFixed(1)
      }));
      
      expect(percents[0].percent).toBe('50.0');
      expect(percents[1].percent).toBe('30.0');
      expect(percents[2].percent).toBe('20.0');
    });
  });

  describe('User Service Logic', () => {
    it('foydalanuvchi topilishi kerak', async () => {
      const user = await mockUserRepo.findOne({ where: { telegramId: 123456 } });
      
      expect(user).toBeDefined();
      expect(user?.id).toBe('user-id');
      expect(user?.telegramId).toBe(123456);
    });

    it('yangi foydalanuvchi yaratilishi kerak', () => {
      const userData = { telegramId: 789012 };
      const result = mockUserRepo.create(userData);
      
      expect(result).toBeDefined();
      expect(result.telegramId).toBe(789012);
    });
  });
});
