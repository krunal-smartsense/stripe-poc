import { Sequelize } from 'sequelize-typescript';
import config from '../config/config';
import { User } from './user';
import { Logger } from '../../helpers/logger.service';
import { Account } from './accounts';
import { AccountUser } from './accountUser';
import { UserPlans } from './userPlans';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
const logger = Logger.getInstance();

const sequelize = new Sequelize({
  database: dbConfig.database,
  username: dbConfig.username,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: console.log,
  pool: dbConfig.pool,
  models: [User, Account, AccountUser, UserPlans], // Add all your models here
});

const db: any = {
  sequelize,
  Sequelize,
  User,
  Account,
  AccountUser,
};

sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connected');
  })
  .catch((error) => {
    logger.error('Error while trying to connect with database:', error);
  });

function initializeDatabase(dbObj: any) {
  Object.values(dbObj).forEach((model: any) => {
    if (typeof model.associate === 'function') {
      model.associate(dbObj);
    }
    if (typeof model.seed === 'function') {
      model.seed(dbObj);
    }
  });
}

console.log("🚀 ~ dbConfig.sync.alter:", dbConfig.sync.alter);
if (dbConfig.sync.alter) {
  sequelize
    .sync({ force: dbConfig.sync.force, alter: dbConfig.sync.alter })
    .then(async () => {  
      initializeDatabase(db);
      logger.info('Database synchronized');
    })
    .catch((error) => {
      logger.error('An error occurred in synchronization: ', error);
    });
} else {
  initializeDatabase(db);
}

export { Sequelize, sequelize };