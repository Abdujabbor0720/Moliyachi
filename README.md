# Kirim Chiqim Bot 💰

Telegram bot orqali shaxsiy moliyaviy hisob-kitoblarni boshqarish uchun bot.

## Xususiyatlar

- 📝 Xarajatlarni qo'shish va kategoriyalarga ajratish
- 💵 Daromadlarni qo'shish
- 💰 Umumiy balansni ko'rish
- 📊 Haftalik va oylik hisobotlar
- ⚠️ Xarajat limiti oshganda avtomatik ogohlantirish

## Texnologiyalar

- **Node.js + TypeScript**
- **grammY** - Telegram bot framework
- **PostgreSQL** - Ma'lumotlar bazasi
- **TypeORM** - ORM
- **Vitest** - Test framework

## O'rnatish

### 1. Repositoryni clone qilish

```bash
git clone <repo-url>
cd Kirim_Chiqim
```

### 2. Dependency'larni o'rnatish

```bash
npm install
```

### 3. Environment sozlamalari

`.env` faylini yarating:

```env
BOT_TOKEN=your_telegram_bot_token
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=kirim_chiqim
```

### 4. PostgreSQL bazasini yaratish

```sql
CREATE DATABASE kirim_chiqim;
```

### 5. Botni ishga tushirish

```bash
npm run dev
```

## Bot Komandalar

| Komanda        | Tavsif                       |
| -------------- | ---------------------------- |
| `/start`       | Botni ishga tushirish        |
| `/add_expense` | Yangi xarajat qo'shish       |
| `/add_income`  | Yangi daromad qo'shish       |
| `/balance`     | Umumiy balansni ko'rish      |
| `/report`      | Haftalik/oylik hisobot olish |

## Loyiha Strukturasi

```text
src/
  app.ts                # Bot start, middlewares
  bot/
    index.ts            # Bot instance
    commands/
      addExpense.ts     # Xarajat qo'shish
      addIncome.ts      # Daromad qo'shish
      balance.ts        # Balans ko'rish
      report.ts         # Hisobot olish
  db/
    dataSource.ts       # TypeORM config
    entities/
      User.ts
      Expense.ts
      Income.ts
  services/
    expense.service.ts
    income.service.ts
    report.service.ts
    balance.service.ts
    user.service.ts
  utils/
    constants.ts        # Konstantalar
    format.ts           # Formatlash funksiyalari
tests/
  bot.test.ts
  services.test.ts
  utils.test.ts
```

## Testlar

```bash
npm test
```

## Skriptlar

| Skript          | Tavsif                               |
| --------------- | ------------------------------------ |
| `npm run dev`   | Development rejimida ishga tushirish |
| `npm run build` | TypeScript kompilatsiya              |
| `npm start`     | Production rejimida ishga tushirish  |
| `npm test`      | Testlarni ishga tushirish            |

## Xarajat Limiti

Default xarajat limiti: **5,000,000 so'm** (oylik)

Agar oylik xarajatlaringiz bu limitdan oshsa, bot avtomatik ravishda ogohlantirish yuboradi.

## Tugmalar (Keyboard)

Bot pastki tugmalar orqali ham boshqariladi:

| Tugma | Vazifasi |
|-------|----------|
| ➕ Xarajat qo'shish | Yangi xarajat kiritish |
| 💵 Daromad qo'shish | Yangi daromad kiritish |
| 💰 Balans | Umumiy balansni ko'rish |
| 📊 Hisobot | Haftalik/oylik hisobot |
| 🏠 Bosh menyu | Bosh menyuga qaytish |

## Skrinshot

Bot `/start` buyrug'idan so'ng pastki tugmalarni ko'rsatadi va foydalanuvchi ularni bosib ishlashi mumkin.

## Muallif

Abdujabbor

## Litsenziya

MIT
