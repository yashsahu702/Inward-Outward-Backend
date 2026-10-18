// src/middleware/auth.ts

import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { User, Role } from '../models'
import { AuthRequest } from '../types/auth.types'

dotenv.config()

// export const authenticateJWT = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authHeader = req.headers.authorization

//   if (authHeader) {
//     const token = authHeader.split(' ')[1]

//     try {
//       const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string)

//       // Fetch the user including their roles (using the alias defined in associations)
//       const user = await User.findByPk(decoded.id, {
//         include: [
//           {
//             model: Role,
//             as: 'roles',
//             through: { attributes: [] }, // omit bridging attributes
//           },
//         ],
//       })

//       if (!user) {
//         return res.sendStatus(403)
//       }

//       req.user = user
//       return next()
//     } catch (err: any) {
//       console.error(err)

//       if (err.name === 'TokenExpiredError') {
//         return res.status(401).json({ message: 'Token expired' });
//       }


//       return res.sendStatus(403).json({
//         message: 'Auth Token is Missing',
//       })
//     }
//   } else {
//     return res.sendStatus(401).json({ message: 'Authorization header missing' })
//   }
// }

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // No token — immediately respond and return
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      // User not found — immediately respond and return
      return res.status(403).json({ message: 'User not found' });
    }

    req.user = user;

    // All good — move to next middleware or controller
    return next();

  } catch (err: any) {
    console.error('JWT Error:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(403).json({ message: 'Invalid or missing token' });
  }
};


/**
 * Middleware to authorize users based on allowed roles.
 * It checks the roles included on req.user (populated by authenticateJWT).
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.sendStatus(401)
    }

    // Assuming our User model includes Roles via a belongsToMany association
    const userRoleNames =
      req.user.roles?.map((role: any) => role.roleName) || []
    console.log(userRoleNames, allowedRoles)
    if (allowedRoles.some((role) => userRoleNames.includes(role))) {
      next()
    } else {
      res.status(403).json({
        message: 'You do not have the required role',
      })
    }
  }
}

/**
 * Helper function that retrieves the department access records for a user.
 * It returns the authorized suburb IDs and layout IDs.
 */
// export const getAuthorizedDepartmentAccess = async (userId: string) => {
//   const accesses = await DepartmentUserAccess.findAll({
//     where: { userId },
//     attributes: ['layoutId'],
//   })

//   // const suburbIds = accesses
//   //   .map((a: any) => a.suburbId)
//   //   .filter((id: any) => id !== null)
//   const layoutIds = accesses
//     .map((a: any) => a.layoutId)
//     .filter((id: any) => id !== null)

//   return { layoutIds }
// }

/**
 * Middleware to attach department access information to the request.
 * For example, it fetches the authorized suburb and layout IDs assigned to the user.
 */
// export const departmentAuthMiddleware = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.id
//     if (!userId) {
//       return res.status(401).json({
//         error: 'Unauthorized',
//         message: 'Department User does not have access',
//       })
//     }

//     const { layoutIds } = await getAuthorizedDepartmentAccess(userId)
//     // Attach these to the request for use in route handlers.
//     // req.authorizedSuburbIds = suburbIds
//     req.authorizedLayoutIds = layoutIds

//     // console.log('Department access for user', userId, layoutIds)
//     next()
//   } catch (error) {
//     console.error('Error in department auth middleware:', error)
//     res.status(500).json({ error: 'Internal server error' })
//   }
// }



// export const getAuthorizedWardIds = async (
//   userId: string
// ): Promise<string[]> => {
//   const userWards = await UserWard.findAll({
//     where: { userId },
//     attributes: ['wardId'],
//   })

//   return userWards.map((uw) => uw.wardId)
// }

// export const wardAuthMiddleware = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.id
//     if (!userId) {
//       return res.status(401).json({ error: 'Unauthorized' })
//     }

//     // Get authorized ward IDs from userWards table
//     const authorizedWardIds = await getAuthorizedWardIds(userId)
//     console.log(
//       'wardAuthMiddleWare userid, userWards',
//       userId,
//       authorizedWardIds
//     )

//     // Attach to request for use in route handlers
//     req.authorizedWardIds = authorizedWardIds

//     next()
//   } catch (error) {
//     console.error('Error in ward auth middleware:', error)
//     res.status(500).json({ error: 'Internal server error' })
//   }
// }
