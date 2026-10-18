// src/routes/authRoutes.ts

import express from 'express'


import {
  registerUser,
  loginUser,
  getAllUsers,
  updateUser,
  updateDefaultPassword,

} from '../controllers/authNewController'
import { authenticateJWT } from '../middleware/auth'

const router = express.Router()

// Register a new user
// router.post('/createUser', registerUser)
// router.post('/assignRole', assignRoleToUser)

// Login routes
router.post('/login', loginUser) // Traditional login
router.post('/register', authenticateJWT, registerUser)
router.get('/users', authenticateJWT, getAllUsers)
router.post('/user/edit', authenticateJWT, updateUser)
router.post('/changePassword', authenticateJWT, updateDefaultPassword)


// router.post('/login/otp/verify', verifyLoginOTP) // Verify OTP and login

// router.post('/forgot-password', forgotPassword)
// router.post('/change-default-password', authenticateJWT, updateDefaultPassword)
// router.post('/reset-password/:token', resetPassword)

export default router
