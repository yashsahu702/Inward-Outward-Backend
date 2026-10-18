// // src/routes/userRoutes.ts
// import { Router } from 'express'
// import { createUserWithWards } from '../controllers/userController'
// import { authenticateJWT, authorizeRoles } from '../middleware/auth'

// const router = Router()

// // Only an admin or specific role should create users
// router.post(
//   '/createWithWards',
//   authenticateJWT,
//   authorizeRoles('ADMIN'), // or whichever roles you allow to create new users
//   createUserWithWards
// )

// export default router
