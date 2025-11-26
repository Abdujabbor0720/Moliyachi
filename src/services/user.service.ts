import { AppDataSource } from "../db/dataSource";
import { User } from "../db/entities/User";

const userRepository = AppDataSource.getRepository(User);

export async function findOrCreateUser(telegramId: number): Promise<User> {
  let user = await userRepository.findOne({ where: { telegramId } });

  if (!user) {
    user = userRepository.create({ telegramId });
    await userRepository.save(user);
  }

  return user;
}

export async function findUserByTelegramId(
  telegramId: number
): Promise<User | null> {
  return userRepository.findOne({ where: { telegramId } });
}
