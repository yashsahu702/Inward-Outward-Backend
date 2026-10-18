import { DataTypes, Model, Sequelize } from "sequelize";

export class UsedToken extends Model {
  public token!: string;

  static initialize(sequelize: Sequelize) {
    UsedToken.init(
      {
        token: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
      },
      {
        sequelize,
        tableName: "used_tokens",
        timestamps: false, // If you don't need createdAt/updatedAt columns
      }
    );
  }
}
