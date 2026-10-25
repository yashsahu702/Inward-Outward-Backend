import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types/auth.types'

import { Javak } from '../models/javak.model';
import { Avak } from '../models/avak.model';
import { Sender } from '../models/sender.model';
import { Branch } from '../models/branch.model';
import { Section } from '../models/section.model';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

import { Document } from '../models/document.model';
import { DocumentType } from '../models/enums';

//const JAVAK_STATUSES = [
//     'Draft',
//     'Pending Dispatch',
//     'Dispatched',
//     'Delivered',
//     'Returned',
//     'Cancelled',
// ];

// const DISPATCH_MODES = [
//     'Speed Post',
//     'Registered Post (AD)',
//     'Courier',
//     'Hand Delivery',
//     'Email',
//     'WhatsApp / SMS',
//     'Fax',
// ];

/**
 * Common associations:
 * Javak -> Avak -> Sender, Branch, Marked Section
 */
const javakIncludes = [
    {
        model: Avak,
        as: 'avak',
        required: false,
        include: [
            {
                model: Sender,
                as: 'sender',
                attributes: [
                    'id',
                    'senderName',
                    'senderType',
                    'organization',
                    'designation',
                    'address',
                    'district',
                    'taluka',
                    'pinCode',
                    'mobile',
                    'email',
                    'activeFlag',
                ],
                required: false,
            },
            {
                model: Branch,
                as: 'branch',
                attributes: ['id', 'branchName', 'branchCode'],
                required: false,
            },
            {
                model: Section,
                as: 'markedSection',
                attributes: ['id', 'sectionName', 'sectionCode'],
                required: false,
            },
        ],
    },
];

/**
 * GET JAVAK BY ID
 * Fetches Javak with its associated Avak, sender, branch and section.
 */
export const getJavakById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'JAVAK ID is required.',
            });
        }

        const javak = await Javak.findByPk(id, {
            include: javakIncludes,
        });

        if (!javak) {
            return res.status(404).json({
                message: 'JAVAK not found.',
            });
        }

        // Fetch related JAVAK documents
        const documents = await Document.findAll({
            where: {
                entityId: javak.id,
                documentType: DocumentType.JAVAK_DOC,
            },
            order: [['createdAt', 'ASC']],
        });

        return res.status(200).json({
            message: `JAVAK fetched successfully. JAVAK Number: ${javak.javakNumber}`,
            data: {
                ...javak.toJSON(),
                documents,
            },
        });
    } catch (error: any) {
        console.error('getJavakById error:', error);

        return res.status(500).json({
            message: 'Failed to fetch JAVAK.',
            error: error.message,
        });
    }
};
/**
 * GET ALL JAVAK
 * Supports pagination and optional status/dispatch-mode filters.
 */
export const getAllJavak = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const page = Math.max(
            1,
            parseInt(String(req.body.page || '1'), 10) || 1
        );

        const pageSize = Math.min(
            100,
            Math.max(
                1,
                parseInt(String(req.body.limit || '10'), 10) || 10
            )
        );

        const offset = (page - 1) * pageSize;

        const {
            status,
            dispatchMode,
            javakNumber,
            avakId,
        } = req.body;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (dispatchMode) {
            where.dispatchMode = dispatchMode;
        }

        if (javakNumber) {
            where.javakNumber = {
                [Op.iLike]: `%${String(javakNumber).trim()}%`,
            };
        }

        if (avakId) {
            where.avakId = avakId;
        }

        const { count, rows } = await Javak.findAndCountAll({
            where,
            include: javakIncludes,
            distinct: true,
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']],
        });

        // Fetch documents for JAVAK records on this page
        const javakIds = rows.map((javak) => javak.id);

        const documents = javakIds.length
            ? await Document.findAll({
                  where: {
                      entityId: {
                          [Op.in]: javakIds,
                      },
                      documentType: DocumentType.JAVAK_DOC,
                  },
                  order: [['createdAt', 'ASC']],
              })
            : [];

        // Group documents by JAVAK ID
        const documentsByJavakId = new Map<
            string,
            typeof documents
        >();

        for (const document of documents) {
            const entityId = document.entityId;

            const existingDocuments =
                documentsByJavakId.get(entityId) ?? [];

            existingDocuments.push(document);
            documentsByJavakId.set(entityId, existingDocuments);
        }

        // Attach documents to each JAVAK record
        const data = rows.map((javak) => ({
            ...javak.toJSON(),
            documents: documentsByJavakId.get(javak.id) ?? [],
        }));

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            message: 'JAVAK records fetched successfully.',
            data,
            pagination: {
                totalRecords: count,
                totalPages,
                currentPage: page,
                pageSize,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error: any) {
        console.error('getAllJavak error:', error);

        return res.status(500).json({
            message: 'Failed to fetch JAVAK records.',
            error: error.message,
        });
    }
};

/**
 * UPDATE JAVAK
 * Supports partial updates.
 */
// export const updateJavak = async (
//     req: AuthRequest,
//     res: Response
// ) => {
//     try {
//         const { id } = req.body;

//         if (!id) {
//             return res.status(400).json({
//                 message: 'JAVAK ID is required.',
//             });
//         }

//         const javak = await Javak.findByPk(id);

//         if (!javak) {
//             return res.status(404).json({
//                 message: 'JAVAK not found.',
//             });
//         }

//         const {
//             isDocumentReceived,
//             receivedDocumentDate,
//             actionRemarks,
//             status,
//             dispatchMode,
//         } = req.body;

//         const updates: Record<string, any> = {};

//         // Validate and update document receipt flag.
//         if (isDocumentReceived !== undefined) {
//             if (typeof isDocumentReceived !== 'boolean') {
//                 return res.status(400).json({
//                     message: 'isDocumentReceived must be a boolean.',
//                 });
//             }

//             updates.isDocumentReceived = isDocumentReceived;
//         }

//         // Validate and update receipt date.
//         if (receivedDocumentDate !== undefined) {
//             if (
//                 receivedDocumentDate !== null &&
//                 (
//                     typeof receivedDocumentDate !== 'string' ||
//                     !/^\d{4}-\d{2}-\d{2}$/.test(receivedDocumentDate) ||
//                     Number.isNaN(Date.parse(receivedDocumentDate))
//                 )
//             ) {
//                 return res.status(400).json({
//                     message: 'receivedDocumentDate must be a valid date in YYYY-MM-DD format or null.',
//                 });
//             }

//             updates.receivedDocumentDate = receivedDocumentDate;
//         }

//         // Validate and update remarks.
//         if (actionRemarks !== undefined) {
//             if (
//                 actionRemarks !== null &&
//                 typeof actionRemarks !== 'string'
//             ) {
//                 return res.status(400).json({
//                     message: 'actionRemarks must be a string or null.',
//                 });
//             }

//             updates.actionRemarks =
//                 typeof actionRemarks === 'string'
//                     ? actionRemarks.trim()
//                     : null;
//         }

//         // Validate and update status.
//         if (status !== undefined) {
//             if (
//                 typeof status !== 'string' 
//             ) {
//                 return res.status(400).json({
//                     message: 'Invalid status.',            
//                 });
//             }

//             updates.status = status;
//         }

//         // Validate and update dispatch mode.
//         if (dispatchMode !== undefined) {
//             if (
//                 dispatchMode !== null &&
//                 (
//                     typeof dispatchMode !== 'string'
                    
//                 )
//             ) {
//                 return res.status(400).json({
//                     message: 'Invalid dispatchMode.',
                   
//                 });
//             }

//             updates.dispatchMode = dispatchMode;
//         }

//         if (Object.keys(updates).length === 0) {
//             return res.status(400).json({
//                 message: 'No valid fields provided for update.',
//             });
//         }

//         // Record the authenticated user who updated the entry.
//         const userId = req.user?.id;

//         if (userId) {
//             updates.updatedBy = userId;
//         }

//         await javak.update(updates);

//         // Fetch the updated record with all associated details.
//         const updatedJavak = await Javak.findByPk(id, {
//             include: javakIncludes,
//         });

//         return res.status(200).json({
//             message: `JAVAK updated successfully. JAVAK Number: ${javak.javakNumber}`,
//             data: updatedJavak,
//         });
//     } catch (error: any) {
//         console.error('updateJavak error:', error);

//         return res.status(500).json({
//             message: 'Failed to update JAVAK.',
//             error: error.message,
//         });
//     }
// };




export const updateJavak = async (
    req: AuthRequest,
    res: Response
) => {
    const temporaryFiles: string[] = [];
    const permanentFiles: string[] = [];

    try {
        const { id } = req.body;

        const uploadedFiles = (
            Array.isArray(req.files) ? req.files : []
        ) as Express.Multer.File[];

        temporaryFiles.push(
            ...uploadedFiles.map((file) => file.path)
        );

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                message: 'JAVAK ID is required.',
            });
        }

        const javak = await Javak.findByPk(id);

        if (!javak) {
            return res.status(404).json({
                message: 'JAVAK not found.',
            });
        }

        const {
            isDocumentReceived,
            receivedDocumentDate,
            actionRemarks,
            status,
            dispatchMode,
        } = req.body;

        const updates: Record<string, any> = {};

        // Validate document receipt flag
        if (isDocumentReceived !== undefined) {
            if (isDocumentReceived !== true && isDocumentReceived !== false &&
                isDocumentReceived !== 'true' && isDocumentReceived !== 'false') {
                return res.status(400).json({
                    message: 'isDocumentReceived must be a boolean.',
                });
            }

            updates.isDocumentReceived =
                isDocumentReceived === true || isDocumentReceived === 'true';
        }

        // Validate receipt date
        if (receivedDocumentDate !== undefined) {
            if (receivedDocumentDate !== null) {
                if (
                    typeof receivedDocumentDate !== 'string' ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(receivedDocumentDate) ||
                    Number.isNaN(Date.parse(`${receivedDocumentDate}T00:00:00Z`)) ||
                    new Date(`${receivedDocumentDate}T00:00:00Z`)
                        .toISOString()
                        .slice(0, 10) !== receivedDocumentDate
                ) {
                    return res.status(400).json({
                        message:
                            'receivedDocumentDate must be a valid date in YYYY-MM-DD format or null.',
                    });
                }
            }

            updates.receivedDocumentDate = receivedDocumentDate;
        }

        // Validate remarks
        if (actionRemarks !== undefined) {
            if (
                actionRemarks !== null &&
                typeof actionRemarks !== 'string'
            ) {
                return res.status(400).json({
                    message: 'actionRemarks must be a string or null.',
                });
            }

            updates.actionRemarks =
                typeof actionRemarks === 'string'
                    ? actionRemarks.trim()
                    : null;
        }

        // Validate status
        if (status !== undefined) {
        //     const allowedStatuses = [
        //         'Draft',
        //         'Dispatched',
        //         'Delivered',
        //         'Returned',
        //         'Cancelled',
        //     ];

            if (
                typeof status !== 'string' 
              
            ) {
                return res.status(400).json({
                    message: 'Invalid status.',
                 //   allowedValues: allowedStatuses,
                });
            }

            updates.status = status;
        }

        // Validate dispatch mode
        if (dispatchMode !== undefined) {
            if (
                dispatchMode !== null &&
                typeof dispatchMode !== 'string'
            ) {
                return res.status(400).json({
                    message: 'dispatchMode must be a string or null.',
                });
            }

            updates.dispatchMode = dispatchMode;
        }

        if (Object.keys(updates).length === 0 && uploadedFiles.length === 0) {
            return res.status(400).json({
                message: 'Provide at least one field or document to update.',
            });
        }

        const userId = req.user?.id;

        if (userId) {
            updates.updatedBy = userId;
        }

        // Save uploaded documents and create Document records
        const newDocuments: Array<{
            filePath: string;
            fileName: string;
            documentType: DocumentType;
            entityId: string;
        }> = [];

        for (const file of uploadedFiles) {
            const storedFile = await createStoredJavakFile(
                javak.id,
                file
            );

            permanentFiles.push(storedFile.absolutePath);

            newDocuments.push({
                filePath: storedFile.filePath,
                fileName: storedFile.fileName,
                documentType: DocumentType.JAVAK_DOC,
                entityId: javak.id,
            });
        }

        // Update JAVAK fields
        if (Object.keys(updates).length > 0) {
            await javak.update(updates);
        }

        // Insert document records
        if (newDocuments.length > 0) {
            await Document.bulkCreate(newDocuments);
        }

        // Remove temporary uploaded files
        await Promise.all(
            temporaryFiles.map((filePath) =>
                fs.promises.unlink(filePath).catch(() => undefined)
            )
        );

        // Fetch updated JAVAK with associated details
        const updatedJavak = await Javak.findByPk(id, {
            include: javakIncludes,
        });

        const documents = await Document.findAll({
            where: {
                entityId: javak.id,
                documentType: DocumentType.JAVAK_DOC,
            },
            order: [['createdAt', 'ASC']],
        });

        return res.status(200).json({
            message: `JAVAK updated successfully. JAVAK Number: ${javak.javakNumber}`,
            data: {
                ...updatedJavak?.toJSON(),
                documents,
            },
        });
    } catch (error: any) {
        console.error('updateJavak error:', error);

        // Clean up permanent files if the operation fails
        await Promise.all(
            permanentFiles.map((filePath) =>
                fs.promises.unlink(filePath).catch(() => undefined)
            )
        );

        return res.status(500).json({
            message: 'Failed to update JAVAK.',
            error: error.message,
        });
    } finally {
        // Ensure temporary files are removed
        await Promise.all(
            temporaryFiles.map((filePath) =>
                fs.promises.unlink(filePath).catch(() => undefined)
            )
        );
    }
};

const createStoredJavakFile = async (
    javakId: string,
    file: Express.Multer.File
): Promise<{
    filePath: string;
    fileName: string;
    absolutePath: string;
}> => {
    const uploadDir = process.env.UPLOAD_DIR;

    if (!uploadDir) {
        throw new Error('UPLOAD_DIR environment variable must be set');
    }

    const allowedExtensions = new Set([
        '.pdf',
        '.doc',
        '.docx',
        '.jpg',
        '.jpeg',
        '.png',
    ]);

    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
        throw new Error('Unsupported file type');
    }

    const fileName = `${javakId}-${Date.now()}-${randomUUID()}${extension}`;
    const relativePath = path.join('Javak', fileName);
    const baseDir = path.resolve(uploadDir);
    const absolutePath = path.resolve(baseDir, relativePath);

    if (!absolutePath.startsWith(baseDir + path.sep)) {
        throw new Error('Invalid file path');
    }

    await fs.promises.mkdir(path.dirname(absolutePath), {
        recursive: true,
    });

    await fs.promises.copyFile(file.path, absolutePath);

    return {
        filePath: relativePath,
        fileName: file.originalname,
        absolutePath,
    };
};