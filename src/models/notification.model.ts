import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export enum NotificationType {
  STATUS_UPDATE_DUE = 'STATUS_UPDATE_DUE',
  STATUS_UPDATE_OVERDUE = 'STATUS_UPDATE_OVERDUE',
  STATUS_UPDATED = 'STATUS_UPDATED',
  STATUS_NOT_UPDATED = 'STATUS_NOT_UPDATED',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

interface NotificationAttributes {
  id: string
  userId: string
  buildingId: string
  type: NotificationType
  message: string
  status: NotificationStatus
  dueDate?: Date | null
  isEmailSent: boolean
  isSMSSent: boolean
  createdAt?: Date
  updatedAt?: Date
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'createdAt' | 'updatedAt'
>

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {
  public id!: string
  public userId!: string
  public buildingId!: string
  public type!: NotificationType
  public message!: string
  public status!: NotificationStatus
  public dueDate?: Date | null
  public isEmailSent!: boolean
  public isSMSSent!: boolean

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initialize(sequelize: Sequelize) {
    Notification.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_id',
        },
        buildingId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'building_id',
        },
        type: {
          type: DataTypes.ENUM(...Object.values(NotificationType)),
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(NotificationStatus)),
          allowNull: false,
          defaultValue: NotificationStatus.UNREAD,
        },
        dueDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'due_date',
        },
        isEmailSent: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          field: 'is_email_sent',
        },
        isSMSSent: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          field: 'is_sms_sent',
        },
      },
      {
        sequelize,
        tableName: 'notifications',
        timestamps: true,
        underscored: true,
      }
    )
  }

  static associate(models: any) {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
    Notification.belongsTo(models.Building, {
      foreignKey: 'buildingId',
      as: 'building',
    })
  }
}
