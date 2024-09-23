import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Account } from './accounts';

interface AccountUserAttributes {
    id: number;
    accountId: number;
    userId: number;
    permission: string;
    onboarded: boolean;
    accountInfo?: Account
}

interface AccountUserCreationAttributes extends Optional<AccountUserAttributes, 'id'> { }

class AccountUser extends Model<AccountUserAttributes, AccountUserCreationAttributes> implements AccountUserAttributes {
    public id!: number;
    public accountId!: number;
    public userId!: number;
    public permission!: string;
    public onboarded!: boolean;
    public accountInfo?: Account

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static associate(models: any) {
        AccountUser.belongsTo(models.Account, { foreignKey: 'accountId', as: 'accountInfo' });
        AccountUser.belongsTo(models.User, { foreignKey: 'userId', as: 'accountUserInfo' });
    }

    public static initialize(sequelize: Sequelize) {
        AccountUser.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                accountId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'account', // references the 'account' table
                        key: 'id',
                    },
                    onDelete: 'CASCADE',
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'user', // references the 'user' table
                        key: 'id',
                    },
                    onDelete: 'CASCADE',
                },
                permission: {
                    type: DataTypes.ENUM('admin', 'owner', 'user'),
                    allowNull: false,
                },
                onboarded: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                }
            },
            {
                sequelize,
                modelName: 'AccountUser',
                tableName: 'account_users',
                timestamps: true,
                underscored: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                paranoid: true,
            }
        );
        return AccountUser;
    }

}

export { AccountUser };
