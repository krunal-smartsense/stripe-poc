import { Table, Column, Model, HasOne, HasMany, DataType } from 'sequelize-typescript';
import { AccountUser } from './accountUser';
import { Account } from './accounts';
import { UserPlans } from './userPlans';

@Table({
  tableName: 'user',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  @HasOne(() => Account)
  accountInfo?: Account;

  @HasOne(() => AccountUser)
  accountUserInfo?: AccountUser;

  @HasMany(() => UserPlans)
  userPlanInfo!: UserPlans[]; 

  @Column({
    type: DataType.DATE,
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
  })
  updatedAt!: Date;
}