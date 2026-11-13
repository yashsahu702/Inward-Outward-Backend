
import { Router } from 'express';
import {
    getAllAudits,
    getAuditById
} from '../controllers/auditController';

const router = Router();

router.post('/getAllAudits', getAllAudits);
router.get('/getAuditById/:id', getAuditById);

export default router;
