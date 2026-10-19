import {
    Model,
    DataTypes,
    Sequelize,
    Optional,
} from 'sequelize';

interface BranchAttributes {
    id: string;
    branchName: string;
    branchCode: string;
    senderId: string;
    activeFlag: boolean;
    createdBy: string;
    createdOn: Date;
    updatedBy?: string | null;
    updatedOn?: Date | null;
}

interface BranchCreationAttributes
    extends Optional<
        BranchAttributes,
        | 'id'
        | 'activeFlag'
        | 'createdOn'
        | 'updatedOn'
        | 'updatedBy'
    > {}

class Branch
    extends Model<BranchAttributes, BranchCreationAttributes>
    implements BranchAttributes
{
    declare id: string;
    declare branchName: string;
    declare branchCode: string;
    declare senderId: string;
    declare activeFlag: boolean;
    declare createdBy: string;
    declare createdOn: Date;
    declare updatedBy: string | null;
    declare updatedOn: Date | null;

    static initialize(sequelize: Sequelize) {
        Branch.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                branchName: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'branch_name',
                },
                branchCode: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'branch_code',
                },
                senderId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'senders',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    field: 'sender_id',
                },
                activeFlag: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                    field: 'active_flag',
                },
                createdBy: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'created_by',
                },
                createdOn: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'created_on',
                },
                updatedBy: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    field: 'updated_by',
                },
                updatedOn: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: 'updated_on',
                },
            },
            {
                sequelize,
                tableName: 'branches',
                timestamps: false,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ['sender_id', 'branch_code'],
                    },
                ],
            }
        );
    }
}

export { Branch };