// src/models/role.model.ts
import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

interface RoleAttributes {
  roleId: string
  roleName: string
  createdAt?: Date
  updatedAt?: Date
}

type RoleCreationAttributes = Optional<
  RoleAttributes,
  'roleId' | 'createdAt' | 'updatedAt'
>

export class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  public roleId!: string
  public roleName!: string

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initialize(sequelize: Sequelize) {
    Role.init(
      {
        roleId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          field: 'role_id',
        },
        roleName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          field: 'role_name',
        },
      },
      {
        sequelize,
        tableName: 'roles',
        timestamps: true,
        underscored: true,
      }
    )
  }

  static associate() {
    // define associations in index.ts
  }
}
