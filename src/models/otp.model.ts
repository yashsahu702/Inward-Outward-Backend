// src/models/otp.model.ts

import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

// Extend your interface to include userId
export interface OtpAttributes {
  otpId: string
  userId: string // <--- NEW: references the 'id' in User table
  identifier: string // e.g. phone or email for reference
  code: string
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

export type OtpCreationAttributes = Optional<
  OtpAttributes,
  'otpId' | 'createdAt' | 'updatedAt'
>

export class Otp
  extends Model<OtpAttributes, OtpCreationAttributes>
  implements OtpAttributes
{
  public otpId!: string
  public userId!: string // <--- stored as a string if your User.id is a UUID
  public identifier!: string
  public code!: string
  public expiresAt!: Date

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initialize(sequelize: Sequelize) {
    Otp.init(
      {
        otpId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          field: 'otp_id',
        },
        userId: {
          // This references User.id (usually a UUID)
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_id',
        },
        identifier: {
          // Could be phone or email
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'identifier',
        },
        code: {
          type: DataTypes.STRING(10),
          allowNull: false,
          field: 'code',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at',
        },
      },
      {
        sequelize,
        tableName: 'otps',
        timestamps: true,
        underscored: true,
      }
    )
  }

  static associate() {
    // We'll define the association in src/models/index.ts, e.g.:
    //   User.hasMany(Otp, { foreignKey: 'userId', as: 'otps' })
    //   Otp.belongsTo(User, { foreignKey: 'userId', as: 'user' })
  }
}
