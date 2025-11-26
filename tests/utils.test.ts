import { describe, it, expect } from 'vitest';
import { formatBalance, formatReport, formatLimitWarning, formatNumber } from '../src/utils/format';

describe('Format Utils', () => {
  describe('formatNumber', () => {
    it('raqamni togri formatlashi kerak', () => {
      const result = formatNumber(1000000);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });
  });

  describe('formatBalance', () => {
    it('balans hisobotini togri formatlashi kerak', () => {
      const result = formatBalance(500000, 200000);
      expect(result).toContain('Umumiy daromad');
      expect(result).toContain('Umumiy xarajat');
      expect(result).toContain('Sof balans');
    });
  });

  describe('formatReport', () => {
    it('hisobotni togri formatlashi kerak', () => {
      const categories = [
        { category: 'oziq-ovqat', total: 100000 },
        { category: 'transport', total: 50000 },
      ];
      const result = formatReport('Haftalik', categories, 500000, 150000);
      expect(result).toContain('Haftalik');
      expect(result).toContain('oziq-ovqat');
      expect(result).toContain('transport');
    });

    it('kategoriyalar bosh bolganda ham ishlashi kerak', () => {
      const result = formatReport('Oylik', [], 0, 0);
      expect(result).toContain('Xarajatlar mavjud emas');
    });
  });

  describe('formatLimitWarning', () => {
    it('ogohlantirish xabarini togri formatlashi kerak', () => {
      const result = formatLimitWarning(6000000, 5000000);
      expect(result).toContain('Diqqat');
      expect(result).toContain('limiti oshdi');
    });
  });
});
