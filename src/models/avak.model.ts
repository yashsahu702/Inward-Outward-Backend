import {
    Model,
    DataTypes,
    Sequelize,
    Optional,
} from 'sequelize';

interface AvakAttributes {
    id: string;
    avakNumber: string;
    registrationDate: Date;
    letterReferenceNumber: string | null;
    letterDate: Date | null;
    subject: string;
    briefDescription: string | null;
    correspondenceType: string;
    priority: string;
    confidentiality: string;
    senderId: string;
    receivingMode: string;
    departmentId: string | null;
    branchId: string | null;
    slaDays: number;
    markedSectionId: string;
    status: string;
    createdBy: string;
    updatedBy: string | null;
    markedBy: string | null;
    markedAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type AvakCreationAttributes = Optional<
    AvakAttributes,
    | 'id'
    | 'avakNumber'
    | 'letterReferenceNumber'
    | 'letterDate'
    | 'briefDescription'
    | 'departmentId'
    | 'branchId'
    | 'updatedBy'
    | 'markedBy'
    | 'markedAt'
    | 'createdAt'
    | 'updatedAt'
>;

export class Avak
    extends Model<AvakAttributes, AvakCreationAttributes>
    implements AvakAttributes {

    public id!: string;
    public avakNumber!: string;
    public registrationDate!: Date;
    public letterReferenceNumber!: string | null;
    public letterDate!: Date | null;
    public subject!: string;
    public briefDescription!: string | null;
    public correspondenceType!: string;
    public priority!: string;
    public confidentiality!: string;
    public senderId!: string;
    public receivingMode!: string;
    public departmentId!: string | null;
    public branchId!: string | null;
    public slaDays!: number;
    public markedSectionId!: string;
    public status!: string;
    public createdBy!: string;
    public updatedBy!: string | null;
    public markedBy!: string | null;
    public markedAt!: Date | null;
    public declare readonly createdAt: Date;
    public declare readonly updatedAt: Date;

    static initialize(sequelize: Sequelize) {
        Avak.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },

                avakNumber: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                    unique: true,
                    field: 'avak_number',
                },

                registrationDate: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'registration_date',
                },

                letterReferenceNumber: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    field: 'letter_reference_number',
                },

                letterDate: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                    field: 'letter_date',
                },

                subject: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    field: 'subject',
                },

                briefDescription: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: 'brief_description',
                },

                correspondenceType: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: 'correspondence_type',
                },

                priority: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                    defaultValue: 'NORMAL',
                    field: 'priority',
                },

                confidentiality: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                    defaultValue: 'NORMAL',
                    field: 'confidentiality',
                },

                senderId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'sender_id',
                },

                receivingMode: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: 'receiving_mode',
                },

                departmentId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    field: 'department_id',
                },

                branchId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    field: 'branch_id',
                },

                slaDays: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 7,
                    field: 'sla_days',
                    validate: {
                        min: 0,
                    },
                },

                markedSectionId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'marked_section_id',
                },

                status: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                    defaultValue: 'RECEIVED',
                    field: 'status',
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

                markedBy: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    field: 'marked_by',
                },

                markedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: 'marked_at',
                },
            },
            {
                sequelize,
                tableName: 'avaks',
                timestamps: true,
                underscored: true,

                hooks: {
                    beforeValidate: async (avak) => {
                        if (!avak.isNewRecord || avak.avakNumber) {
                            return;
                        }

                        const [results] = await sequelize.query(
                            `SELECT 'AVK-' || nextval('avak_number_seq') AS avak_number`
                        );

                        const row = (results as Array<{
                            avak_number: string;
                        }>)[0];

                        avak.avakNumber = row.avak_number;
                    },
                },
            }
        );
    }

    static associate() {}
}


// CREATE SEQUENCE IF NOT EXISTS avak_number_seq
//     START WITH 1256
//     INCREMENT BY 1
//     NO CYCLE;