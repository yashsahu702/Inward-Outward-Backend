
import { Router } from 'express'
import {
    createSender,
    updateSender,
    getSenders,
    getSenderById,
    getSendersByType,
    getSendersByOrganization,
} from '../controllers/senderController'

const router = Router()

router.post('/createSender', createSender)
router.post('/updateSender', updateSender)
router.get('/getSenders', getSenders)
router.get('/getSenderById/:id', getSenderById)
router.get('/type/:senderType', getSendersByType);
router.get('/organization/:organization', getSendersByOrganization);

export default router
