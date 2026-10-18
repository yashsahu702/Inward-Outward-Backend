
import { Router } from 'express'
import {
    createSection,
    updateSection,
    getSections,
    getSectionById,
} from '../controllers/sectionController'

const router = Router()

router.post('/createSection', createSection)
router.post('/updateSection', updateSection)
router.get('/getSections', getSections)
router.get('/getSectionById/:id', getSectionById)

export default router
