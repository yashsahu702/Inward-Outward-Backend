import { Router } from 'express';
import {
    updateJavak,
    getJavakById,
    getAllJavak,
} from '../controllers/javakController';

const router = Router();

router.post('/getAll', getAllJavak);
router.get('/getByid/:id', getJavakById);
router.post('/update', updateJavak);

export default router;