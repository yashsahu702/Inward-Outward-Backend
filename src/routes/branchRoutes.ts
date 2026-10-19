
import { Router } from 'express'
import {
    createBranch,
    updateBranch,
    getBranches,
    getBranchById,
    getBranchesBySenderId,
} from '../controllers/branchController'

const router = Router()

router.post('/createBranch', createBranch)
router.post('/updateBranch', updateBranch)
router.get('/getBranches', getBranches)
router.get('/getBranchById/:id', getBranchById)
router.get(
    '/getBySenderId/:SenderId',
    getBranchesBySenderId
)
export default router
