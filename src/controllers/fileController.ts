
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../types/auth.types';
import { Document, Audit } from '../models';
import { DocumentType, EntityType } from '../models/enums';
import { Transaction } from 'sequelize';
import { randomUUID } from 'crypto';

const ALLOWED_EXTENSIONS = new Set([
    '.pdf',
    '.doc',
    '.docx',
    '.jpg',
    '.jpeg',
    '.png',
]);

const getSafeFilePath = (filePath: string): string => {
    const uploadDir = process.env.UPLOAD_DIR;

    if (!uploadDir) {
        throw new Error('UPLOAD_DIR environment variable must be set');
    }

    const baseDir = path.resolve(uploadDir);
    const absolutePath = path.resolve(baseDir, filePath);

    if (
        absolutePath === baseDir ||
        !absolutePath.startsWith(baseDir + path.sep)
    ) {
        throw new Error('Invalid file path');
    }

    return absolutePath;
};

// Upload multiple documents for an Avak
export const uploadAvakDocuments = async (
    req: AuthRequest,
    res: Response
) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const avakId = req.body.avakId;
    const userId = req.user?.id;

    const tempFiles = files ?? [];

    try {
        if (!avakId) {
            return res.status(400).json({
                message: 'avakId is required',
            });
        }

        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated',
            });
        }

        if (tempFiles.length === 0) {
            return res.status(400).json({
                message: 'At least one document is required',
            });
        }

        const uploadDir = process.env.UPLOAD_DIR;

        if (!uploadDir) {
            throw new Error('UPLOAD_DIR environment variable must be set');
        }

        // Verify that the Avak exists before saving its documents.
        const avakExists = await (
            await import('../models/avak.model')
        ).Avak.findByPk(avakId);

        if (!avakExists) {
            return res.status(404).json({
                message: 'Avak not found',
            });
        }

        const savedDocuments = [];

        for (const file of tempFiles) {
            const extension = path.extname(file.originalname).toLowerCase();

            if (!ALLOWED_EXTENSIONS.has(extension)) {
                throw new Error(`Unsupported file type: ${file.originalname}`);
            }

            const folderName = 'Avak';
            const uniqueFileName =
                `${avakId}-${Date.now()}-${crypto.randomUUID()}${extension}`;

            const relativePath = path.join(folderName, uniqueFileName);
            const absolutePath = getSafeFilePath(relativePath);

            await fs.promises.mkdir(path.dirname(absolutePath), {
                recursive: true,
            });

            await fs.promises.copyFile(file.path, absolutePath);

            const document = await Document.create({
                filePath: relativePath,
                fileName: file.originalname,
                documentType: DocumentType.AVAK_DOC,
                entityId: avakId,
            });

            await Audit.create({
                entity: EntityType.DOCUMENT,
                entityId: document.id,
                action: 'Create',
                performedBy: userId,
                remarks: `Avak document uploaded: ${file.originalname}`,
                ipAddress: req.ip,
                timestamp: new Date(),
            });

            savedDocuments.push(document);
        }

        return res.status(201).json({
            message: 'Avak documents uploaded successfully',
            data: savedDocuments,
        });
    } catch (error) {
        console.error('Error uploading Avak documents:', error);

        return res.status(500).json({
            message: 'Failed to upload Avak documents',
            error:
                process.env.NODE_ENV === 'development'
                    ? String(error)
                    : undefined,
        });
    } finally {
        // Remove temporary uploaded files.
        await Promise.all(
            tempFiles.map(async (file) => {
                try {
                    await fs.promises.unlink(file.path);
                } catch {
                    // Temporary file may already have been removed.
                }
            })
        );
    }
};

// View a document by passing its stored relative file path.
export const viewDocument = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated',
            });
        }

        const { filePath } = req.body as { filePath?: string };

        if (!filePath || typeof filePath !== 'string') {
            return res.status(400).json({
                message: 'filePath is required',
            });
        }

        let absolutePath: string;

        try {
            absolutePath = getSafeFilePath(filePath);
        } catch {
            return res.status(403).json({
                message: 'Invalid file path',
            });
        }

        try {
            await fs.promises.access(absolutePath, fs.constants.R_OK);
        } catch {
            return res.status(404).json({
                message: 'Document not found',
            });
        }

        const extension = path.extname(absolutePath).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(extension)) {
            return res.status(400).json({
                message: 'Unsupported document type',
            });
        }

        const inlineExtensions = new Set([
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
        ]);

        const contentType: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.doc': 'application/msword',
            '.docx':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };

        res.setHeader(
            'Content-Type',
            contentType[extension] || 'application/octet-stream'
        );

        res.setHeader(
            'Content-Disposition',
            `${inlineExtensions.has(extension) ? 'inline' : 'attachment'}; filename="${path.basename(absolutePath)}"`
        );

        return res.sendFile(absolutePath);
    } catch (error) {
        console.error('Error viewing document:', error);

        return res.status(500).json({
            message: 'Failed to view document',
        });
    }

    


};


const createStoredFile = async (
    avakId: string,
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

    const extension = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
        throw new Error('Unsupported file type');
    }

    const fileName = `${avakId}-${Date.now()}-${randomUUID()}${extension}`;
    const relativePath = path.join('Avak', fileName);
    const absolutePath = getSafeFilePath(relativePath);

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


export const replaceDocument = async (
    req: AuthRequest,
    res: Response
) => {
    let newFilePath: string | null = null;

    try {
        const { documentId } = req.params;
        const file = req.file;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated',
            });
        }

        if (!file) {
            return res.status(400).json({
                message: 'Replacement file is required',
            });
        }

        const extension = path.extname(file.originalname).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(extension)) {
            return res.status(400).json({
                message: 'Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed',
            });
        }

        const document = await Document.findOne({
            where: {
                id: documentId,
             //   documentType: DocumentType.AVAK_DOC,
            },
        });

        if (!document) {
            return res.status(404).json({
                message: 'Avak document not found',
            });
        }

        const avakId = document.entityId;

        const stored = await createStoredFile(avakId, file);
        newFilePath = stored.absolutePath;

        const oldFilePath = getSafeFilePath(document.filePath);

        await document.update({
            filePath: stored.filePath,
            fileName: file.originalname,
        });

        // Delete old file only after the database update succeeds.
        try {
            await fs.promises.unlink(oldFilePath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error('Could not delete old document file:', error);
            }
        }

        return res.status(200).json({
            message: 'Document replaced successfully',
            data: document,
        });
    } catch (error) {
        // Remove the new file if replacement failed.
        if (newFilePath) {
            try {
                await fs.promises.unlink(newFilePath);
            } catch {
                // File may already be absent.
            }
        }

        console.error('Error replacing Avak document:', error);

        return res.status(500).json({
            message: 'Failed to replace document',
        });
    } finally {
        if (req.file?.path) {
            try {
                await fs.promises.unlink(req.file.path);
            } catch {
                // Temporary file may already be absent.
            }
        }
    }
};




export const deleteDocument = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { documentId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated',
            });
        }

        const document = await Document.findOne({
            where: {
                id: documentId,
             //   documentType: DocumentType.AVAK_DOC,
            },
        });

        if (!document) {
            return res.status(404).json({
                message: 'Avak document not found',
            });
        }

        const absolutePath = getSafeFilePath(document.filePath);

        // Remove database record first.
        await document.destroy();

        // Remove the physical file.
        try {
            await fs.promises.unlink(absolutePath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error('Could not delete document file:', error);

                return res.status(200).json({
                    message: 'Document record deleted, but physical file cleanup failed',
                });
            }
        }

        return res.status(200).json({
            message: 'Document deleted successfully',
            documentId,
        });
    } catch (error) {
        console.error('Error deleting Avak document:', error);

        return res.status(500).json({
            message: 'Failed to delete document',
        });
    }
};
