import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { User } from '../database/models/user';

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

export interface SubscriptionAttributes {
  id: number;
  userId: number;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id'> {}

@Table({
  tableName: 'subscription',
  timestamps: true,
  underscored: true,
})
export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
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

  @BelongsTo(() => User)
  user?: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  stripeSubscriptionId!: string;

  @Column({
    type: DataType.ENUM('active', 'past_due', 'cancelled', 'trialing'),
    allowNull: false,
    defaultValue: 'active',
  })
  status!: SubscriptionStatus;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  planId!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  currentPeriodStart!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  currentPeriodEnd!: Date;

  @Column({ type: DataType.DATE })
  createdAt!: Date;

  @Column({ type: DataType.DATE })
  updatedAt!: Date;
}
