// src/models/user.model.ts
import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyAddAssociationMixin,
} from 'sequelize'
import bcrypt from 'bcryptjs'
import { Role } from './role.model'


interface UserAttributes {
  id: string
  name: string
  email: string
  mobileNumber: string
  passwordHash: string
  isVerified: boolean
  createdAt?: Date
  updatedAt?: Date
  username: string
  isPasswordChanged: boolean
}

type UserCreationAttributes = Optional<
  UserAttributes,
  | 'id'
  | 'mobileNumber'
  | 'isVerified'
  | 'createdAt'
  | 'updatedAt'
  | 'username'
  | 'isPasswordChanged'
>

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: string

  public name!: string
  public email!: string
  public mobileNumber !: string

  public passwordHash!: string

  public isVerified!: boolean
  public username!: string
  public isPasswordChanged!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public getRoles!: () => Promise<Role[]>
  public addRole!: BelongsToManyAddAssociationMixin<Role, string>
  public addRoles!: BelongsToManyAddAssociationsMixin<Role, string>
  public removeRole!: BelongsToManyRemoveAssociationMixin<Role, string>
  public removeRoles!: BelongsToManyRemoveAssociationsMixin<Role, string>

  public readonly roles?: Role[]

  static initialize(sequelize: Sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        mobileNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'password_hash',
        },

        isVerified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_verified',
        },
        isPasswordChanged: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_Password_changed',
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
          beforeCreate: async (user: User) => {
            if (user.passwordHash) {
              const salt = await bcrypt.genSalt(10)
              user.passwordHash = await bcrypt.hash(user.passwordHash, salt)
            }
          },
          beforeUpdate: async (user: User) => {
            if (user.changed('passwordHash')) {
              const salt = await bcrypt.genSalt(10)
              user.passwordHash = await bcrypt.hash(user.passwordHash, salt)
            }
          },
        },
      }
    )
  }

  static associate() {
    // define associations in index.ts
  }
  public async validPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash)
  }
}
