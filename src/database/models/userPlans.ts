import { BelongsTo, Column, DataType, ForeignKey, HasOne, Table, Model } from 'sequelize-typescript';
import { User } from './user';
import { Account } from './accounts';
// import { AccountUserSuscribeProducts } from './accountUserSuscribeProducts';
@Table({
    tableName: 'user_plan',
    timestamps: true,
    underscored: true,
    paranoid: true,
})
class UserPlans extends Model {
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

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    assignedByUserId!: number;


    @BelongsTo(() => User)
    userInfo?: User;

    @ForeignKey(() => Account)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    accountId?: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    priceId?: string;

    @BelongsTo(() => Account)
    accountPlanInfo?: Account;

    @Column({
        type: DataType.DATE,
    })
    createdAt!: Date;

    @Column({
        type: DataType.DATE,
    })
    updatedAt!: Date;

}

export { UserPlans }