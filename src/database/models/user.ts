import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { AccountUser } from './accountUser';
import { UserSuscribeProducts } from './userSubscribeProducts';

interface UserAttributes {
    id: number;
    email: string;
    password: string;
    accountUserInfo?: AccountUser
    userSubscribeProducts?: UserSuscribeProducts,
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public email!: string;
    public password!: string;
    public accountUserInfo?: AccountUser
    public userSubscribeProducts? : UserSuscribeProducts

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static associate(models: any) {
        this.hasOne(models.Account, {as: 'accountInfo', foreignKey: 'userId'})
        this.hasOne(models.AccountUser, { foreignKey: 'userId', as: 'accountUserInfo' })
        this.hasMany(models.UserSuscribeProducts, { foreignKey: 'userId', as: 'userSubscribeProducts' })
    }

    public static initialize(sequelize: Sequelize) {
        this.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                email: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
                }
            },
            {
                sequelize,
                modelName: 'User',
                tableName: 'user',
                timestamps: true,
                underscored: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                paranoid: true,
            }
        )
        return User;
    }

}

export { User }