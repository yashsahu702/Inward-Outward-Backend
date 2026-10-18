import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { getNotifications, markNotificationsAsRead } from '../controllers/notificationOrdmsController'

const router = Router()


router.get('/notifyUser', authenticateJWT, getNotifications)

router.post('/markAsRead', authenticateJWT, markNotificationsAsRead)


export default router
