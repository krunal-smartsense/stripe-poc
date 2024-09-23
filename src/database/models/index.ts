import { Sequelize, SyncOptions } from 'sequelize';
import config from '../config/config';
import { User } from './user'
import {Logger} from '../../helpers/logger.service';
import { Account } from './accounts';
import { AccountUser } from './accountUser';
import { initializeUserSuscribeProducts } from './userSubscribeProducts';
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
const logger = Logger.getInstance();


const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: console.log,
  sync: dbConfig.sync,
  pool: dbConfig.pool
});

const db: any = {
  db:sequelize,

  User: User.initialize(sequelize),
  Account: Account.initialize(sequelize),
  AccountUser: AccountUser.initialize(sequelize),
  UserSuscribeProducts: initializeUserSuscribeProducts(sequelize),
};

sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connected');
  })
  .catch((error) => {
    logger.error('Error while try to connect with database:', error);
  });

function initializeDatabase(dbObj: any) {
  Object.keys(dbObj).forEach((modelName) => {
    if (dbObj[modelName].associate) {
      dbObj[modelName].associate(dbObj);
    }
    if (dbObj[modelName].seed) {
      dbObj[modelName].seed(dbObj);
    }
  });
}

console.log("🚀 ~ dbConfig.sync.alter:", dbConfig.sync.alter)
if (dbConfig.sync.alter) {
  sequelize
    .sync({ force: dbConfig.sync.force, alter: dbConfig.sync.alter })
    .then(async() => {  
      initializeDatabase(db);
      logger.info('Database synchronized');
    })
    .catch((error) => {
      logger.log("🚀 ~ error:", error)
      if (error) {
        logger.error('An error occurred in synchronization: ', error);
      }
    });
} else {
  initializeDatabase(db);
}

export { Sequelize, sequelize };