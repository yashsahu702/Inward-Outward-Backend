
import { Router } from 'express'
import {
    createUserSection,
    updateUserSection,
    getUserSections,
    getUserSectionById,
    getUserSectionsByUserId,
} from '../controllers/userSectionController'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.post('/createUserSection',authenticateJWT, createUserSection)
router.post('/updateUserSection',authenticateJWT, updateUserSection)
router.get('/getUserSections',authenticateJWT, getUserSections)

// Keep this route before '/:id'
router.get('/user/:userId',authenticateJWT, getUserSectionsByUserId)

router.get('/userSection/:id',authenticateJWT, getUserSectionById)

export default router
