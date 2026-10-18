import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface RemarkRecordAttributes {
    id: string;
    remark: string;
    avakId: string;
    userId: string;
    remarkStatus: string;
    createdAt?: Date;
    updatedAt?: Date;
}

type RemarkRecordCreationAttributes = Optional<
    RemarkRecordAttributes,
    'id' | 'remarkStatus' | 'createdAt' | 'updatedAt'
>;

export class RemarkRecord
    extends Model<RemarkRecordAttributes, RemarkRecordCreationAttributes>
    implements RemarkRecordAttributes {

    public id!: string;
    public remark!: string;
    public avakId!: string;
    public userId!: string;
    public remarkStatus!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static initialize(sequelize: Sequelize) {
        RemarkRecord.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'id',
                },

                remark: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    field: 'remark',
                },

                avakId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'avak_id',
                    references: {
                        model: 'avaks',
                        key: 'id',
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                },

                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'user_id',
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                    onDelete: 'RESTRICT',
                    onUpdate: 'CASCADE',
                },

                remarkStatus: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    defaultValue: 'ACTIVE',
                    field: 'remark_status',
                },
            },
            {
                sequelize,
                tableName: 'remark_records',
                timestamps: true,
                underscored: true,
            }
        );
    }

    static associate() {}
}