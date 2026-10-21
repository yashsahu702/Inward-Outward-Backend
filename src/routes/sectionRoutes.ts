
import { Router } from 'express'
import {
    createSection,
    updateSection,
    getSections,
    getSectionById,
} from '../controllers/sectionController'
import { authenticateJWT } from '../middleware/auth'
const router = Router()

router.post('/createSection',authenticateJWT, createSection)
router.post('/updateSection',authenticateJWT, updateSection)
router.get('/getSections',authenticateJWT, getSections)
router.get('/getSectionById/:id',authenticateJWT, getSectionById)

export default router
