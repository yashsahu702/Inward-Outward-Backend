import { Router } from 'express';
import { getAvakJavakStatusCounts, getDashboard } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/auth'


const router = Router();

router.post('/summary',authenticateJWT, getDashboard);

router.post(
    '/avak-javak-status-counts',
    authenticateJWT,
    getAvakJavakStatusCounts
);

export default router;