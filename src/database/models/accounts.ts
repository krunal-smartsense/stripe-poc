import { Table, Column, Model, BelongsTo, HasMany, ForeignKey, DataType, Unique } from 'sequelize-typescript';
import { User } from './user';
import { AccountUser } from './accountUser';
import { UserPlans } from './userPlans';

@Table({
  tableName: 'account',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
        name: 'unique_account',
        unique: true,
        fields: ['user_id', 'stripe_customer_id', 'stripe_subscription_id']
    }
  ]
})
export class Account extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  stripeCustomerId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  stripeSubscriptionId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  plan?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  active!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isMainPlan!: boolean;

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => AccountUser)
  accountUserInfo!: AccountUser[];

  @HasMany(() => UserPlans)
  accountUserPlanInfo!: UserPlans[]; 

  @Column({
    type: DataType.DATE,
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
  })
  updatedAt!: Date;
}