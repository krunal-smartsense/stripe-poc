import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
// import { AccountUserSuscribeProducts } from './accountUserSuscribeProducts';

interface UserSuscribeProductsAttributes {
    id: number;
    userId: number;
    priceId: string;
    // accountUserSuscribeProductsInfo?: AccountUserSuscribeProducts
}

interface UserSuscribeProductsCreationAttributes extends Optional<UserSuscribeProductsAttributes, 'id'> { }

class UserSuscribeProducts extends Model<UserSuscribeProductsAttributes, UserSuscribeProductsCreationAttributes> implements UserSuscribeProductsAttributes {
    public id!: number;
    public userId!: number;
    public priceId!: string;

    // public accountUserSuscribeProductsInfo?: AccountUserSuscribeProducts

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static associate(models: any) {
        UserSuscribeProducts.belongsTo(models.User, { foreignKey: 'userId', as: 'userSubscribeProducts' })
    }

}
function initializeUserSuscribeProducts(sequelize: Sequelize) {
    UserSuscribeProducts.init(
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
                field: 'user_id'
            },
            priceId: {
                type: DataTypes.STRING,
                allowNull: false,
                field: 'price_id'
            },
        },
        {
            sequelize,
            modelName: 'UserSuscribeProducts',
            tableName: 'user_suscribe_products',
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            paranoid: true,
        }
    )
    return UserSuscribeProducts;
}

export { UserSuscribeProducts, UserSuscribeProductsAttributes, UserSuscribeProductsCreationAttributes, initializeUserSuscribeProducts }