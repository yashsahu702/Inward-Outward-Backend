import {
    Model,
    DataTypes,
    Sequelize,
    Optional,
} from 'sequelize';

interface BranchSectionAttributes {
    id: string;
    branchSectionName: string;
    branchSectionCode: string | null;
    branchId: string;
}

interface BranchSectionCreationAttributes
    extends Optional<
        BranchSectionAttributes,
        'id' | 'branchSectionCode'
    > {}

class BranchSection
    extends Model<
        BranchSectionAttributes,
        BranchSectionCreationAttributes
    >
    implements BranchSectionAttributes
{
    declare id: string;
    declare branchSectionName: string;
    declare branchSectionCode: string | null;
    declare branchId: string;

    static initialize(sequelize: Sequelize) {
        BranchSection.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                branchSectionName: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'branch_section_name',
                },
                branchSectionCode: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: 'branch_section_code',
                },
                branchId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                        model: 'branches',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'branch_id',
                },
            },
            {
                sequelize,
                tableName: 'branch_sections',
                timestamps: false,
                underscored: true,
            }
        );
    }
}

export { BranchSection };