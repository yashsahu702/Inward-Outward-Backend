import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface UserSectionAttributes {
    id: string;
    userId: string;
    sectionId: string;
    createdBy?: string | null;
    createdOn?: Date;
}

type UserSectionCreationAttributes = Optional<
    UserSectionAttributes,
    'id' | 'createdBy' | 'createdOn'
>;

export class UserSection
    extends Model<UserSectionAttributes, UserSectionCreationAttributes>
    implements UserSectionAttributes {

    public id!: string;
    public userId!: string;
    public sectionId!: string;
    public createdBy!: string | null;
    public createdOn!: Date;

    static initialize(sequelize: Sequelize) {
        UserSection.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'user_id',
                    unique: 'unique_user_section',
                },
                sectionId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'section_id',
                    unique: 'unique_user_section',
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
            },
            {
                sequelize,
                tableName: 'user_sections',
                timestamps: false,
                underscored: true,
            }
        );
    }

    static associate() {}
}