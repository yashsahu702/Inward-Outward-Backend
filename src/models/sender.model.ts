import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface SenderAttributes {
    id: string;
    senderName: string;
    senderType: string;
    organization: string;
    designation: string;
    address: string;
    district: string;
    taluka: string;
    pinCode: string;
    mobile: string;
    email?: string | null;
    activeFlag: boolean;
    createdBy?: string | null;
    createdOn?: Date;
    updatedBy?: string | null;
    updatedOn?: Date;
}

type SenderCreationAttributes = Optional<
    SenderAttributes,
    | 'id'
    | 'email'
    | 'activeFlag'
    | 'createdBy'
    | 'createdOn'
    | 'updatedBy'
    | 'updatedOn'
>;

export class Sender
    extends Model<SenderAttributes, SenderCreationAttributes>
    implements SenderAttributes {

    public id!: string;
    public senderName!: string;
    public senderType!: string;
    public organization!: string;
    public designation!: string;
    public address!: string;
    public district!: string;
    public taluka!: string;
    public pinCode!: string;
    public mobile!: string;
    public email!: string | null;
    public activeFlag!: boolean;
    public createdBy!: string | null;
    public createdOn!: Date;
    public updatedBy!: string | null;
    public updatedOn!: Date;

    static initialize(sequelize: Sequelize) {
        Sender.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },
                senderName: {
                    type: DataTypes.STRING(150),
                    allowNull: false,
                    field: 'sender_name',
                },
                senderType: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: 'sender_type',
                },
                organization: {
                    type: DataTypes.STRING(150),
                    allowNull: false,
                    field: 'organization',
                },
                designation: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'designation',
                },
                address: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    field: 'address',
                },
                district: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'district',
                },
                taluka: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'taluka',
                },
                pinCode: {
                    type: DataTypes.STRING(6),
                    allowNull: false,
                    field: 'pin_code',
                    validate: {
                        is: /^\d{6}$/,
                    },
                },
                mobile: {
                    type: DataTypes.STRING(10),
                    allowNull: false,
                    field: 'mobile',
                    validate: {
                        is: /^\d{10}$/,
                    },
                },
                email: {
                    type: DataTypes.STRING(150),
                    allowNull: true,
                    field: 'email',
                    validate: {
                        isEmail: true,
                    },
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
                tableName: 'senders',
                timestamps: false,
                underscored: true,
            }
        );
    }

    static associate() {}
}