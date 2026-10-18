import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface BranchAttributes {
    id: string;
    branchName: string;
    branchCode: string;
    departmentId: string;
    activeFlag: boolean;
    createdBy?: string | null;
    createdOn?: Date;
    updatedBy?: string | null;
    updatedOn?: Date;
}

type BranchCreationAttributes = Optional<
    BranchAttributes,
    | 'id'
    | 'activeFlag'
    | 'createdBy'
    | 'createdOn'
    | 'updatedBy'
    | 'updatedOn'
>;

export class Branch
    extends Model<BranchAttributes, BranchCreationAttributes>
    implements BranchAttributes {

    public id!: string;
    public branchName!: string;
    public branchCode!: string;
    public departmentId!: string;
    public activeFlag!: boolean;
    public createdBy!: string | null;
    public createdOn!: Date;
    public updatedBy!: string | null;
    public updatedOn!: Date;

    static initialize(sequelize: Sequelize) {
        Branch.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },
                branchName: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'branch_name',
                },
                branchCode: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: 'branch_code',
                },
                departmentId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'department_id',
                },
                activeFlag: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                    field: 'active_flag',
                },
                createdBy: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    field: 'created_by',
                },
                createdOn: {
                    type: DataTypes.DATE,
                    allowNull: true,
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
                    defaultValue: DataTypes.NOW,
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
                        fields: ['department_id', 'branch_code'],
                    },
                ],
            }
        );
    }

    static associate() {}
}