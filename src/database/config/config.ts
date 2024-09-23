// config.ts

import { SyncOptions } from "sequelize";
import * as dotenv from 'dotenv';

dotenv.config()

interface PoolConfig {
  max: number;
  min: number;
  acquire: number;
  idle: number;
}

interface DatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: 'postgres';
  operatorsAliases: '0';
  logging: boolean;
  sync: SyncOptions;
  pool: PoolConfig;
}

interface Config {
  [key: string]: DatabaseConfig;
  development: DatabaseConfig;
  local: DatabaseConfig;
  production: DatabaseConfig;
}

const config: Config = {
  development: {
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    operatorsAliases: '0',
    logging: false,
    sync: {
      force: false,
      alter: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  local: {
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    operatorsAliases: '0',
    logging: true,
    sync: {
      force: false,
      alter: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    operatorsAliases: '0',
    logging: false,
    sync: {
      force: false,
      alter: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};

export default config;

module.exports = config;

