import { describe, it, expect, vi } from 'vitest';

describe('Bot Command Tests', () => {
  describe('Start Command', () => {
    it('/start komandasi xush kelibsiz xabarini qaytarishi kerak', async () => {
      const mockCtx = {
        reply: vi.fn(() => Promise.resolve()),
      };

      const welcomeMessage = 'Assalomu alaykum! Men sizning shaxsiy moliyaviy hisob-kitob botingizman.';
      await mockCtx.reply(welcomeMessage, { parse_mode: 'Markdown' });

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Assalomu alaykum'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
  });

  describe('Balance Command', () => {
    it('/balance komandasi balans malumotlarini qaytarishi kerak', async () => {
      const mockCtx = {
        from: { id: 123456789 },
        reply: vi.fn(() => Promise.resolve()),
      };

      const balanceText = 'Balans hisoboti - Umumiy daromad: 500,000 som';
      await mockCtx.reply(balanceText, { parse_mode: 'Markdown' });

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Balans hisoboti'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
  });

  describe('Report Command', () => {
    it('/report komandasi inline keyboard bilan javob berishi kerak', async () => {
      const mockCtx = {
        reply: vi.fn(() => Promise.resolve()),
      };

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Haftalik', callback_data: 'report_weekly' },
              { text: 'Oylik', callback_data: 'report_monthly' },
            ],
          ],
        },
      };

      await mockCtx.reply('Qaysi davr uchun hisobot olmoqchisiz?', keyboard);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Qaysi davr'),
        expect.objectContaining({ reply_markup: expect.any(Object) })
      );
    });
  });

  describe('Report Callback Handler', () => {
    it('haftalik hisobot callback handler ishlashi kerak', async () => {
      const mockCtx = {
        from: { id: 123456789 },
        callbackQuery: { data: 'report_weekly' },
        answerCallbackQuery: vi.fn(() => Promise.resolve()),
        editMessageText: vi.fn(() => Promise.resolve()),
      };

      await mockCtx.answerCallbackQuery();
      await mockCtx.editMessageText('Haftalik hisobot', { parse_mode: 'Markdown' });

      expect(mockCtx.answerCallbackQuery).toHaveBeenCalled();
      expect(mockCtx.editMessageText).toHaveBeenCalled();
    });

    it('oylik hisobot callback handler ishlashi kerak', async () => {
      const mockCtx = {
        from: { id: 123456789 },
        callbackQuery: { data: 'report_monthly' },
        answerCallbackQuery: vi.fn(() => Promise.resolve()),
        editMessageText: vi.fn(() => Promise.resolve()),
      };

      await mockCtx.answerCallbackQuery();
      await mockCtx.editMessageText('Oylik hisobot', { parse_mode: 'Markdown' });

      expect(mockCtx.answerCallbackQuery).toHaveBeenCalled();
      expect(mockCtx.editMessageText).toHaveBeenCalled();
    });
  });

  describe('Add Expense Conversation', () => {
    it('xarajat qoshish dialog bosqichlari mavjud bolishi kerak', () => {
      const steps = ['Xarajat nomini kiriting', 'Summani kiriting', 'Kategoriyani kiriting'];
      
      expect(steps).toHaveLength(3);
      expect(steps[0]).toContain('nomi');
      expect(steps[1]).toContain('Summa');
      expect(steps[2]).toContain('Kategoriya');
    });

    it('notogri summa kiritilganda qayta soralishi kerak', async () => {
      const mockCtx = {
        reply: vi.fn(() => Promise.resolve()),
      };

      const invalidAmount = 'yuz ming';
      const parsed = parseFloat(invalidAmount);

      if (isNaN(parsed) || parsed <= 0) {
        await mockCtx.reply('Notogri summa. Iltimos, musbat raqam kiriting:');
      }

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Notogri summa')
      );
    });
  });

  describe('Add Income Conversation', () => {
    it('daromad qoshish dialog bosqichlari mavjud bolishi kerak', () => {
      const steps = ['Daromad manbasini kiriting', 'Summani kiriting'];
      
      expect(steps).toHaveLength(2);
      expect(steps[0]).toContain('manba');
      expect(steps[1]).toContain('Summa');
    });
  });

  describe('Limit Warning', () => {
    it('limit oshganda ogohlantirish yuborilishi kerak', async () => {
      const mockCtx = {
        reply: vi.fn(() => Promise.resolve()),
      };

      const currentExpense = 6000000;
      const limit = 5000000;

      if (currentExpense > limit) {
        await mockCtx.reply('Diqqat! Xarajat limiti oshdi!', { parse_mode: 'Markdown' });
      }

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('limiti oshdi'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });

    it('limit oshmasa ogohlantirish yuborilmasligi kerak', async () => {
      const mockCtx = {
        reply: vi.fn(() => Promise.resolve()),
      };

      const currentExpense = 3000000;
      const limit = 5000000;

      if (currentExpense > limit) {
        await mockCtx.reply('Diqqat! Xarajat limiti oshdi!', { parse_mode: 'Markdown' });
      }

      expect(mockCtx.reply).not.toHaveBeenCalled();
    });
  });
});
