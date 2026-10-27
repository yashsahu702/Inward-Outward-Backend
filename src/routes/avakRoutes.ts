
import { Router } from 'express'
import { createAvak, getAllAvak, getAvakById, updateAvak } from '../controllers/avakController'
import { authenticateJWT } from '../middleware/auth'
const router = Router()

router.post('/createAvak',authenticateJWT, createAvak)
router.post('/updateAvak',authenticateJWT, updateAvak)
router.get('/getAll',authenticateJWT, getAllAvak);
router.get('/getByAvakId/:id',authenticateJWT, getAvakById);
export default router



// Pagination

// GET /api/avak?page=1&limit=10

// Search by AVAK number and letter reference

// GET /api/avak?avakNumber=1256&letterReferenceNumber=ABC

// Records for one specific creation date

// GET /api/avak?createdDate=2026-10-19

// Records created between two dates

// GET /api/avak?fromDate=2026-10-01&toDate=2026-10-19

// Records created from a date onward

// GET /api/avak?fromDate=2026-10-01

// Filter by status, priority, and confidentiality

// GET /api/avak?status=RECEIVED&priority=HIGH&confidentiality=CONFIDENTIAL

// Combine search, date range, and pagination

// GET /api/avak?page=2&limit=10&avakNumber=AVK-12&fromDate=2026-10-01&toDate=2026-10-19&status=RECEIVED&correspondenceType=LETTER