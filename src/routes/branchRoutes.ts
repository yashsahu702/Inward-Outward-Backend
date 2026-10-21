
import { Router } from 'express'
import {
    createBranch,
    updateBranch,
    getBranches,
    getBranchById,
    getBranchesBySenderId,
} from '../controllers/branchController'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.post('/createBranch',authenticateJWT, createBranch)
router.post('/updateBranch',authenticateJWT, updateBranch)
router.get('/getBranches',authenticateJWT, getBranches)
router.get('/getBranchById/:id',authenticateJWT, getBranchById)
router.get(
    '/getBySenderId/:SenderId',authenticateJWT,
    getBranchesBySenderId
)
export default router
