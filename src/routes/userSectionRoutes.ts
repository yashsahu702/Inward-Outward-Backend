
import { Router } from 'express'
import {
    createUserSection,
    updateUserSection,
    getUserSections,
    getUserSectionById,
    getUserSectionsByUserId,
} from '../controllers/userSectionController'

const router = Router()

router.post('/createUserSection', createUserSection)
router.post('/updateUserSection', updateUserSection)
router.get('/getUserSections', getUserSections)

// Keep this route before '/:id'
router.get('/user/:userId', getUserSectionsByUserId)

router.get('/userSection/:id', getUserSectionById)

export default router
