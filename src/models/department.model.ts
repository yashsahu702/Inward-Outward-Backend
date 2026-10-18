import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

interface DepartmentAttributes {
    id: string
    departmentName: string
    departmentCode: string
    activeFlag: boolean
    createdBy?: string | null
    createdOn?: Date
    updatedBy?: string | null
    updatedOn?: Date
}

type DepartmentCreationAttributes = Optional<
    DepartmentAttributes,
    | 'id'
    | 'activeFlag'
    | 'createdBy'
    | 'createdOn'
    | 'updatedBy'
    | 'updatedOn'
>

export class Department
    extends Model<DepartmentAttributes, DepartmentCreationAttributes>
    implements DepartmentAttributes {
    public id!: string
    public departmentName!: string
    public departmentCode!: string
    public activeFlag!: boolean
    public createdBy!: string | null
    public createdOn!: Date
    public updatedBy!: string | null
    public updatedOn!: Date

    static initialize(sequelize: Sequelize) {
        Department.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },
                departmentName: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'department_name',
                },
                departmentCode: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: 'department_code',
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
                tableName: 'departments',
                timestamps: false, // because you are using created_on/updated_on manually
                underscored: true,
            }
        )
    }

    static associate() { }
}
