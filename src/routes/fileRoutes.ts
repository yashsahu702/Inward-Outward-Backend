
import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { avakDocumentUpload } from '../middleware/avakDocumentUpload';
import {
    deleteDocument,
    replaceDocument,
    uploadAvakDocuments,
    viewDocument,
} from '../controllers/fileController';

const router = Router();

router.post(
    '/upload/avakDocuments',
    authenticateJWT,
    avakDocumentUpload.array('documents', 10),
    uploadAvakDocuments
);

router.post(
    '/view',
    authenticateJWT,
    viewDocument
);

router.put(
    '/replace/:documentId',
    authenticateJWT,
    avakDocumentUpload.single('document'),
    replaceDocument
);

router.delete(
    '/delete/:documentId',
    authenticateJWT,
    deleteDocument
);

export default router;
