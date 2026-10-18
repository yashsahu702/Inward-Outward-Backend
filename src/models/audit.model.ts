// src/models/audit.model.ts

import { DataTypes, ENUM, Model, Optional, Sequelize } from 'sequelize'
import { User } from './user.model'
import { EntityType } from '../models/enums'

interface AuditAttributes {
  auditId: string
  entity: EntityType
  entityId: string
  action: string // Create, Update, Delete
  performedBy: string // User ID
  remarks?: string
  ipAddress: string
  timestamp: Date
}

interface AuditCreationAttributes
  extends Optional<AuditAttributes, 'auditId' | 'remarks' | 'timestamp'> { }

export class Audit
  extends Model<AuditAttributes, AuditCreationAttributes>
  implements AuditAttributes {
  public auditId!: string
  public entity!: EntityType
  public entityId!: string
  public action!: string
  public performedBy!: string
  public remarks?: string
  public ipAddress!: string
  public timestamp!: Date

  // Associations
  public readonly performedByUser?: User

  static initialize(sequelize: Sequelize) {
    Audit.init(
      {
        auditId: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        entity: {
          type: DataTypes.ENUM(
            EntityType.OLD_RECORD,
            EntityType.BUILDING,
            EntityType.ASSIGNROLE,
            EntityType.DEVELOPER,
            EntityType.ARCHITECT,
            EntityType.DOCUMENT,
            EntityType.ROLE,
            EntityType.NOC,
            EntityType.IOD,
            EntityType.BUILDING_STATUS_PHOTO,
            EntityType.BUILDING_CC,
            EntityType.BUILDING_OC,
            EntityType.SURPLUS_AREA,
            EntityType.SMS_TEMPLATE,
            EntityType.USER
          ),
          allowNull: false,
        },
        entityId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        performedBy: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        remarks: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'audits',
        timestamps: false, // Since we have a timestamp field
      }
    )
  }

  static associate(models: any) {
    // Audit.belongsTo(models.User, {
    //   foreignKey: 'performedBy',
    //   as: 'performedByUser',
    // })
  }
}
