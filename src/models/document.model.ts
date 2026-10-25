
import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { DocumentType } from './enums';

interface DocumentAttributes {
    id: string;
    filePath: string;
    fileName?: string | null;
    documentType: DocumentType;
    entityId: string;
    duration?: string | null;
    startingTime?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

type DocumentCreationAttributes = Optional<
    DocumentAttributes,
    | 'id'
    | 'fileName'
    | 'createdAt'
    | 'updatedAt'
    | 'duration'
    | 'startingTime'
>;

export class Document
    extends Model<DocumentAttributes, DocumentCreationAttributes>
    implements DocumentAttributes {

    public id!: string;
    public filePath!: string;
    public fileName!: string | null;
    public documentType!: DocumentType;
    public entityId!: string;
    public duration!: string | null;
    public startingTime!: Date | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static initialize(sequelize: Sequelize) {
        Document.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                    field: 'id',
                },

                filePath: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'file_path',
                },

                fileName: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: 'file_name',
                },

                documentType: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'document_type',
                },

                entityId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'entity_id',
                },

                duration: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: 'duration',
                },

                startingTime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: 'starting_time',
                },
            },
            {
                sequelize,
                tableName: 'documents',
                timestamps: true,
                underscored: true,
            }
        );
    }

    static associate() {}
}
