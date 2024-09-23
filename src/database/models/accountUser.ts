import { Table, Column, Model, BelongsTo, ForeignKey, DataType } from 'sequelize-typescript';
import { Account } from './accounts';
import { User } from './user';

@Table({
  tableName: 'account_users',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class AccountUser extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  accountId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @Column({
    type: DataType.ENUM('admin', 'owner', 'user'),
    allowNull: false,
  })
  permission!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  onboarded!: boolean;

  @BelongsTo(() => Account)
  accountInfo!: Account;

  @BelongsTo(() => User)
  accountUserInfo!: User;

  @Column({
    type: DataType.DATE,
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
  })
  updatedAt!: Date;
}