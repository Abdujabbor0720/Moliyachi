import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("required_channels")
export class RequiredChannel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  channelId: string; // @username yoki -100...

  @Column()
  title: string;

  @Column()
  url: string;

  @Column({ default: "channel" })
  type: "channel" | "group" | "bot";

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
