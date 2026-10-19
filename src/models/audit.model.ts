import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { User } from './user.model';
import { EntityType } from '../models/enums';

interface AuditAttributes {
  auditId: string;
  entity: EntityType;
  entityId: string;
  action: string;
  performedBy: string;
  remarks?: string;
  ipAddress: string;
  timestamp: Date;
}

interface AuditCreationAttributes
  extends Optional<AuditAttributes, 'auditId' | 'remarks' | 'timestamp'> {}

export class Audit
  extends Model<AuditAttributes, AuditCreationAttributes>
  implements AuditAttributes {

  public auditId!: string;
  public entity!: EntityType;
  public entityId!: string;
  public action!: string;
  public performedBy!: string;
  public remarks?: string;
  public ipAddress!: string;
  public timestamp!: Date;

  public readonly performedByUser?: User;

  static initialize(sequelize: Sequelize) {
    Audit.init(
      {
        auditId: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
          field: 'audit_id',
        },
        entity: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'entity',
        },
        entityId: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'entity_id',
        },
        action: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: 'action',
        },
        performedBy: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'performed_by',
        },
        remarks: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'remarks',
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: false,
          field: 'ip_address',
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'timestamp',
        },
      },
      {
        sequelize,
        tableName: 'audits',
        timestamps: false,
        underscored: true,
      }
    );
  }

  static associate(models: any) {
    Audit.belongsTo(models.User, {
      foreignKey: 'performedBy',
      as: 'performedByUser',
    });
  }
}