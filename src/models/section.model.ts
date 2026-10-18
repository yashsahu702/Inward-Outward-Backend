import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface SectionAttributes {
    id: string;
    sectionName: string;
    sectionCode: string;
    activeFlag: boolean;
    createdBy?: string | null;
    createdOn?: Date;
    updatedBy?: string | null;
    updatedOn?: Date;
}

type SectionCreationAttributes = Optional<
    SectionAttributes,
    | 'id'
    | 'activeFlag'
    | 'createdBy'
    | 'createdOn'
    | 'updatedBy'
    | 'updatedOn'
>;

export class Section
    extends Model<SectionAttributes, SectionCreationAttributes>
    implements SectionAttributes {

    public id!: string;
    public sectionName!: string;
    public sectionCode!: string;
    public activeFlag!: boolean;
    public createdBy!: string | null;
    public createdOn!: Date;
    public updatedBy!: string | null;
    public updatedOn!: Date;

    static initialize(sequelize: Sequelize) {
        Section.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },
                sectionName: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'section_name',
                },
                sectionCode: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    unique: true,
                    field: 'section_code',
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
                tableName: 'sections',
                timestamps: false,
                underscored: true,
            }
        );
    }

    static associate() {}
}