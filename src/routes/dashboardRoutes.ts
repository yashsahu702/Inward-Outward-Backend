import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/auth'


const router = Router();

router.post('/summary',authenticateJWT, getDashboard);

export default router;