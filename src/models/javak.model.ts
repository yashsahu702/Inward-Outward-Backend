import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface JavakAttributes {
  id: string;
  avakId: string;
  javakNumber: string;

  // Document receipt details
  isDocumentReceived: boolean;
  receivedDocumentDate: Date | null;

  // Outward entry details
  actionRemarks: string | null;
  status: string;
  dispatchMode: string | null;

  createdBy: string;
  updatedBy: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

type JavakCreationAttributes = Optional<
  JavakAttributes,
  | 'id'
  | 'javakNumber'
  | 'isDocumentReceived'
  | 'receivedDocumentDate'
  | 'actionRemarks'
  | 'status'
  | 'dispatchMode'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export class Javak
  extends Model<JavakAttributes, JavakCreationAttributes>
  implements JavakAttributes
{
  public id!: string;
  public avakId!: string;
  public javakNumber!: string;

  public isDocumentReceived!: boolean;
  public receivedDocumentDate!: Date | null;

  public actionRemarks!: string | null;
  public status!: string;
  public dispatchMode!: string | null;

  public createdBy!: string;
  public updatedBy!: string | null;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  static initialize(sequelize: Sequelize) {
    Javak.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },

        avakId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          field: 'avak_id',
          references: {
            model: 'avaks',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },

        javakNumber: {
          type: DataTypes.STRING(30),
          allowNull: false,
          unique: true,
          field: 'javak_number',
        },

        isDocumentReceived: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_document_received',
        },

        receivedDocumentDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          field: 'received_document_date',
        },

        actionRemarks: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'action_remarks',
        },

        status: {
          type: DataTypes.STRING(30),
          allowNull: false,
          defaultValue: 'Draft',
            field: 'status',
        },

        dispatchMode: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'dispatch_mode',
        },

        createdBy: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'created_by',
        },

        updatedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'updated_by',
        },
      },
      {
        sequelize,
        tableName: 'javaks',
        timestamps: true,
        underscored: true,

        hooks: {
          beforeValidate: async (javak) => {
            if (!javak.isNewRecord || javak.javakNumber) return;

            const [results] = await sequelize.query(
              `SELECT 'JAVAK-' || LPAD(nextval('javak_number_seq')::TEXT, 4, '0') AS javak_number`
            );

            const row = (
              results as Array<{ javak_number: string }>
            )[0];

            javak.javakNumber = row.javak_number;
          },
        },
      }
    );
  }

  static associate() {
    // Associations are defined in your central model setup.
  }
}

//  validate: {
//             isIn: [[
//               'Draft',
//               'Pending Dispatch',
//               'Dispatched',
//               'Delivered',
//               'Returned',
//               'Cancelled',
//             ]],
//           },

//  validate: {
//             isIn: [[
//               'Speed Post',
//               'Registered Post (AD)',
//               'Courier',
//               'Hand Delivery',
//               'Email',
//               'WhatsApp / SMS',
//               'Fax',
//             ]],
//           },