import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface AccountAttributes {
    id: number;
    name?: string;
    userId: number;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: string;
    active: boolean
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id'> { }

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
    public id!: number;
    public userId!: number;
    public name?: string;
    public stripeCustomerId?: string;
    public stripeSubscriptionId?: string;
    public plan?: string;
    public active!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static associate(models: any) {
        Account.belongsTo(models.User, {as: 'user', foreignKey: 'userId'})
        Account.hasMany(models.AccountUser, {as: 'account_user_info', foreignKey: 'accountId'})
    }
    
    public static initialize(sequelize: Sequelize) {
        Account.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {model: 'user', key: 'id'},
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                stripeCustomerId: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                stripeSubscriptionId: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                plan: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                active: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
            },
            {
                sequelize,
                modelName: 'Account',
                tableName: 'account',
                timestamps: true,
                underscored: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                paranoid: true,
            }
        )
        return Account;
    }
}

export { Account }