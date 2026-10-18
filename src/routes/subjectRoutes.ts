
import { Router } from 'express'
import {
    createSubject,
    updateSubject,
    getSubjects,
    getSubjectById,
    getSubjectsByDepartmentId,
} from '../controllers/subjectController'

const router = Router()

router.post('/createSubject', createSubject)
router.post('/updateSubject', updateSubject)
router.get('/getSubjects', getSubjects)
router.get('/getSubjectById/:id', getSubjectById)
router.get(
    '/getBydepartmentId/:departmentId',
    getSubjectsByDepartmentId
)
export default router
