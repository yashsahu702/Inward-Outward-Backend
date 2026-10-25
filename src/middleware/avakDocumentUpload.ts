
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const tempDir = process.env.TEMP_UPLOAD_DIR || 'temp_uploads';

fs.mkdirSync(tempDir, { recursive: true });

const allowedExtensions = new Set([
    '.pdf',
    '.doc',
    '.docx',
    '.jpg',
    '.jpeg',
    '.png',
]);

export const avakDocumentUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => {
            callback(null, tempDir);
        },
        filename: (_req, file, callback) => {
            callback(
                null,
                `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`
            );
        },
    }),
    limits: {
        files: 10,
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.has(extension)) {
            return callback(
                new Error('Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed')
            );
        }

        callback(null, true);
    },
});
