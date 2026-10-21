
import { Router } from 'express'
import {
    createSender,
    updateSender,
    getSenders,
    getSenderById,
    getSendersByType,
    getSendersByOrganization,
} from '../controllers/senderController'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.post('/createSender',authenticateJWT, createSender)
router.post('/updateSender',authenticateJWT, updateSender)
router.get('/getSenders',authenticateJWT, getSenders)
router.get('/getSenderById/:id',authenticateJWT, getSenderById)
router.get('/type/:senderType',authenticateJWT, getSendersByType);
router.get('/organization/:organization',authenticateJWT, getSendersByOrganization);

export default router
