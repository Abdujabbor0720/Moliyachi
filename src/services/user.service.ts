import { AppDataSource } from "../db/dataSource";
import { User } from "../db/entities/User";

const userRepository = AppDataSource.getRepository(User);

export async function findOrCreateUser(
  telegramId: number,
  username?: string,
  firstName?: string,
  language?: string
): Promise<User> {
  let user = await userRepository.findOne({ where: { telegramId } });

  if (!user) {
    user = userRepository.create({
      telegramId,
      username,
      firstName,
      language: language || "uz",
    });
    await userRepository.save(user);
  } else {
    // Update user info
    if (username) user.username = username;
    if (firstName) user.firstName = firstName;
    await userRepository.save(user);
  }

  return user;
}

export async function findUserByTelegramId(
  telegramId: number
): Promise<User | null> {
  return userRepository.findOne({ where: { telegramId } });
}

export async function getUserLanguage(
  telegramId: number
): Promise<string | null> {
  const user = await userRepository.findOne({ where: { telegramId } });
  if (!user) {
    return null; // Foydalanuvchi topilmasa null qaytaradi
  }
  return user.language || "uz";
}

export async function setUserLanguage(
  telegramId: number,
  language: string
): Promise<void> {
  await userRepository.update({ telegramId }, { language });
}

export async function getAllUsers(): Promise<User[]> {
  return userRepository.find({ where: { isBlocked: false } });
}

export async function getUsersCount(): Promise<number> {
  return userRepository.count();
}

export async function getActiveUsersCount(): Promise<number> {
  return userRepository.count({ where: { isBlocked: false } });
}
