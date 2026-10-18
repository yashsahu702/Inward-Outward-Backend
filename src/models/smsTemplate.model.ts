import { Model, DataTypes, Sequelize, Optional } from 'sequelize'
import { sequelize } from './index'

export interface SmsTemplateAttributes {
  id: number
  templateId: string
  name: string
  content: string
  provider: 'orient' | 'ozone' | 'orientnew'
  description?: string | null
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type SmsTemplateCreationAttributes = Optional<
  SmsTemplateAttributes,
  'id' | 'description' | 'createdAt' | 'updatedAt'
>

export class SmsTemplate
  extends Model<SmsTemplateAttributes, SmsTemplateCreationAttributes>
  implements SmsTemplateAttributes
{
  public id!: number
  public templateId!: string
  public name!: string
  public content!: string
  public provider!: 'orient' | 'ozone' | 'orientnew'
  public description!: string | null
  public isActive!: boolean

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initialize(sequelize: Sequelize) {
    SmsTemplate.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        templateId: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          field: 'template_id',
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        provider: {
          type: DataTypes.ENUM('orient', 'ozone', 'orientnew'),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active',
        },
      },
      {
        sequelize,
        tableName: 'sms_templates',
        timestamps: true,
        underscored: true,
      }
    )
  }

  static associate() {
    // define associations in index.ts if needed
  }
}
