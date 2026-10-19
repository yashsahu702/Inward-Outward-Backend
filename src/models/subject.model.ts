import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface SubjectAttributes {
    id: string;
    subjectName: string;
    subjectCode?: string | null;
    senderId: string;
    activeFlag: boolean;
    createdBy?: string | null;
    createdOn?: Date;
    updatedBy?: string | null;
    updatedOn?: Date;
}

type SubjectCreationAttributes = Optional<
    SubjectAttributes,
    | 'id'
    | 'subjectCode'
    | 'activeFlag'
    | 'createdBy'
    | 'createdOn'
    | 'updatedBy'
    | 'updatedOn'
>;

export class Subject
    extends Model<SubjectAttributes, SubjectCreationAttributes>
    implements SubjectAttributes {

    public id!: string;
    public subjectName!: string;
    public subjectCode?: string | null;
    public senderId!: string;
    public activeFlag!: boolean;
    public createdBy!: string | null;
    public createdOn!: Date;
    public updatedBy!: string | null;
    public updatedOn!: Date;

    static initialize(sequelize: Sequelize) {
        Subject.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },
                subjectName: {
                    type: DataTypes.STRING(150),
                    allowNull: false,
                    field: 'subject_name',
                },
                subjectCode: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    field: 'subject_code',
                },
                senderId: {
                    type: DataTypes.UUID,
                    allowNull: false,
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
                tableName: 'subjects',
                timestamps: false,
                underscored: true,
            }
        );
    }

    static associate() {}
}