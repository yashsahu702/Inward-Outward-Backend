
import { Router } from 'express'
import {
    createSubject,
    updateSubject,
    getSubjects,
    getSubjectById,
    getSubjectsBySenderId,
} from '../controllers/subjectController'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.post('/createSubject',authenticateJWT, createSubject)
router.post('/updateSubject', authenticateJWT,updateSubject)
router.get('/getSubjects',authenticateJWT, getSubjects)
router.get('/getSubjectById/:id',authenticateJWT, getSubjectById)
router.get(
    '/getBySenderId/:senderId',
    authenticateJWT,
    getSubjectsBySenderId
)
export default router
