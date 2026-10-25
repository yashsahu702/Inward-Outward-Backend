import { Router } from 'express';
import {
    updateJavak,
    getJavakById,
    getAllJavak,
} from '../controllers/javakController';
import { authenticateJWT } from '../middleware/auth';
import { avakDocumentUpload } from '../middleware/avakDocumentUpload';

const router = Router();

router.post('/getAll', authenticateJWT, getAllJavak);
router.get('/getByid/:id',authenticateJWT, getJavakById);
router.post(
    '/update',
    authenticateJWT,
    avakDocumentUpload.array('documents', 10),
    updateJavak
);

export default router;