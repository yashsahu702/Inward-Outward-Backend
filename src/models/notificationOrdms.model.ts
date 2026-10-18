import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export enum NotificationType {
  RECORD = 'RECORD',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

interface NotificationAttributes {
  id: string
  userId: string
  departmentId: string
  type: NotificationType
  message: string
  status: NotificationStatus
  dueDate?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'dueDate' | 'createdAt' | 'updatedAt'
>

export class NotificationOrdms
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {

  public id!: string
  public userId!: string
  public departmentId!: string
  public type!: NotificationType
  public message!: string
  public status!: NotificationStatus
  public dueDate!: Date | null

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initialize(sequelize: Sequelize) {
    NotificationOrdms.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        departmentId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM(NotificationType.RECORD),
          allowNull: false,
        },
        message: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(
            NotificationStatus.UNREAD,
            NotificationStatus.READ
          ),
          defaultValue: NotificationStatus.UNREAD,
        },
        dueDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'notifications_ordms',
        timestamps: true,
      }
    )
  }
}