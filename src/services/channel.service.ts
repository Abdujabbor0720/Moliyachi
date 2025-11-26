import { AppDataSource } from "../db/dataSource";
import { RequiredChannel } from "../db/entities/RequiredChannel";

const channelRepository = AppDataSource.getRepository(RequiredChannel);

export async function addRequiredChannel(
  channelId: string,
  title: string,
  url: string,
  type: "channel" | "group" | "bot" = "channel"
): Promise<RequiredChannel> {
  const existing = await channelRepository.findOne({ where: { channelId } });
  if (existing) {
    existing.title = title;
    existing.url = url;
    existing.type = type;
    existing.isActive = true;
    return channelRepository.save(existing);
  }

  const channel = channelRepository.create({
    channelId,
    title,
    url,
    type,
    isActive: true,
  });
  return channelRepository.save(channel);
}

export async function removeRequiredChannel(
  channelId: string
): Promise<boolean> {
  const result = await channelRepository.delete({ channelId });
  return (result.affected ?? 0) > 0;
}

export async function toggleChannelStatus(
  channelId: string
): Promise<RequiredChannel | null> {
  const channel = await channelRepository.findOne({ where: { channelId } });
  if (!channel) return null;

  channel.isActive = !channel.isActive;
  return channelRepository.save(channel);
}

export async function getActiveChannels(): Promise<RequiredChannel[]> {
  return channelRepository.find({ where: { isActive: true } });
}

export async function getAllChannels(): Promise<RequiredChannel[]> {
  return channelRepository.find({ order: { createdAt: "DESC" } });
}

export async function getChannelById(
  id: string
): Promise<RequiredChannel | null> {
  return channelRepository.findOne({ where: { id } });
}

export async function getChannelByChannelId(
  channelId: string
): Promise<RequiredChannel | null> {
  return channelRepository.findOne({ where: { channelId } });
}
