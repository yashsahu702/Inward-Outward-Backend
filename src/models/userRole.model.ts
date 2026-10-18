// src/models/userRole.model.ts

import { DataTypes, Model, Sequelize } from 'sequelize'

interface UserRoleAttributes {
  userId: string
  roleId: string
}

export class UserRole
  extends Model<UserRoleAttributes>
  implements UserRoleAttributes {
  public userId!: string
  public roleId!: string

  static initialize(sequelize: Sequelize) {
    UserRole.init(
      {
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          primaryKey: true,
          field: 'user_id'
        },
        roleId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'roles',
            key: 'roleId',
          },
          primaryKey: true,
          field: 'role_id'
        },
      },
      {
        sequelize,
        tableName: 'user_roles',
        timestamps: false,
      }
    )
  }

  static associate(models: any) {
    // Associations are handled in User and Role models
  }
}
