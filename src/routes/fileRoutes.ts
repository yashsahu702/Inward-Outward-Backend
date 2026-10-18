import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { getFile, getFilePath } from '../controllers/fileController'

const router = Router()

router.get('/getSingleFile', authenticateJWT, getFile)



router.post('/getFile', authenticateJWT, getFilePath)


export default router
