import express from 'express'
import { createDepartment, getDepartmentById, getDepartments, updateDepartment } from '../controllers/departmentController'
import { authenticateJWT } from '../middleware/auth'

const router = express.Router()

router.post('/create', authenticateJWT, createDepartment)
router.post('/update', authenticateJWT, updateDepartment)
router.get('/all', authenticateJWT, getDepartments)
router.get('/getById/:id', authenticateJWT, getDepartmentById)
export default router
