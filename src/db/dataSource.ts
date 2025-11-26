import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Expense } from "./entities/Expense";
import { Income } from "./entities/Income";
import { RequiredChannel } from "./entities/RequiredChannel";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "kirim_chiqim",
  synchronize: true,
  logging: false,
  entities: [User, Expense, Income, RequiredChannel],
});
