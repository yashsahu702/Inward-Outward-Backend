// src/routes/roleRoutes.ts

import express from 'express'
import {
  createRole,
   getRoles,
  // getRoleById,
  updateRole,
  deleteRole,
  // assignFeaturesToRole,
  // removeFeaturesFromRole,
} from '../controllers/roleController'
import { authenticateJWT } from '../middleware/auth' // or your chosen auth middleware

const router = express.Router()

// Protect routes if necessary
router.use(authenticateJWT)

/**
 * POST /roles
 * Create a new role
 */
router.post('/createRole', createRole)

/**
 * GET /roles
 * Get all roles
 */
 router.get('/getAll', getRoles)

/**
 * GET /roles/:id
 * Get role by ID
 */
// router.get('/:id', getRoleById)

/**
 * PUT /roles/:id
 * Update role by ID
 */
router.put('/:id', updateRole)

/**
 * DELETE /roles/:id
 * Delete role by ID
 */
router.delete('/:id', deleteRole)

/**
 * POST /roles/:roleId/features
 * Assign features to role
 */
// router.post(
//   '/:roleId/features',

//   assignFeaturesToRole
// )

// /**
//  * DELETE /roles/:roleId/features
//  * Remove features from role
//  */
// router.delete(
//   '/:roleId/features',

//   removeFeaturesFromRole
// )

export default router
