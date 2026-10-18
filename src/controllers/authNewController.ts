import { Request, Response } from 'express'
import { Op } from 'sequelize'
import { sequelize } from "../models" // <-- change path according to your project
import jwt from 'jsonwebtoken'
import { User } from '../models/user.model'
import { Role } from '../models/role.model'

import { UserRole } from '../models/userRole.model'
import { AuthRequest } from '../types/auth.types'
import { getWelcomeEmailTemplate, sendEmail } from '../config/mailer'

export const registerUser = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction()

  try {
    const {
      name,
      email,
      mobileNumber,
      password,
      username,
      roleIds,
   
    } = req.body

    // ✅ 1) Basic validations
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Mandatory fields missing (name, email, password).',
      })
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({
        message: 'roleIds is required and must be a non-empty array.',
      })
    }

   

    // ✅ Mobile number validation (optional but recommended)
    if (mobileNumber) {
      const mobileRegex = /^[6-9][0-9]{9}$/
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(400).json({ message: 'Invalid mobile number.' })
      }
    }

    // ✅ 2) Check existing user (email/mobile/username)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          ...(mobileNumber ? [{ mobileNumber }] : []),
          ...(username ? [{ username }] : []),
        ],
      },
      transaction,
    })

    if (existingUser) {
      return res.status(400).json({
        message: 'Email / Mobile / Username already registered.',
      })
    }

    // ✅ 3) Validate Role IDs
    const roles = await Role.findAll({
      where: {
        roleId: { [Op.in]: roleIds },
      },
      transaction,
    })

    if (roles.length !== roleIds.length) {
      return res.status(400).json({
        message: 'Invalid roleIds: Some roleIds do not exist.',
      })
    }

 

    // ✅ 5) Create user
    const user = await User.create(
      {
        name,
        email,
        mobileNumber: mobileNumber || null,
        passwordHash: password, // 🔥 User model hook will hash it
        username: username || email,
        isVerified: false,
      },
      { transaction }
    )

    // ✅ 6) Insert UserRole mappings
    const userRolesPayload = roleIds.map((roleId: string) => ({
      userId: user.id,
      roleId,
    }))

    await UserRole.bulkCreate(userRolesPayload, { transaction })

    // ✅ 7) Insert UserDepartment mappings
   

    // ✅ 8) Fetch full user with roles + departments (for response)
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        }
      ],
      transaction,
    })

    await transaction.commit()

    const htmlContent = getWelcomeEmailTemplate(
      user.name,
      user.username,
      password
    )

    await sendEmail(
      user.email,
      "Welcome to the ORDMS System - Your Login Credentials",
      htmlContent
    )

    return res.status(201).json({
      message: 'User registered successfully.',
      user: createdUser,
    })

    return res.status(201).json({
      message: 'User registered successfully.',
      user: createdUser,
    })
  } catch (error: any) {
    await transaction.rollback()
    console.error('registerUser error:', error)

    return res.status(500).json({
      message: 'Failed to register user.',
      error: error?.message || error,
    })
  }
}


export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // ✅ 1) Basic validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      })
    }

    // ✅ 2) Find user with roles + departments
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        }
      ],
    })

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    // ✅ 3) Verify password using your User model method
    const isValid = await user.validPassword(password)
    if (!isValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
      })
    }

    // ✅ 4) Prepare roles data for token
    const userRoles =
      user.roles?.map((r: Role) => ({
        roleId: r.roleId,
        roleName: r.roleName,
      })) || []

    // ✅ 5) Create JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: userRoles,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '24h',
      }
    )

    // ✅ 6) Return same type of response as registerUser
    return res.status(200).json({
      message: 'Login successful',
      token,
      user,
    })
  } catch (error: any) {
    console.error('loginUser error:', error)

    return res.status(500).json({
      message: 'Failed to login',
      error: error?.message || error,
    })
  }
}



export const updateDefaultPassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current password and new password are required' })
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify current password
    const isValidPassword = await user.validPassword(currentPassword)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Update password and set isVerified to true
    user.passwordHash = newPassword
    user.isPasswordChanged = true
    user.isVerified = true
    await user.save()

    return res.status(200).json({
      message: 'Password updated successfully',
      isVerified: true,
      isPasswordChanged: true
    })
  } catch (error) {
    console.error('Error in updateDefaultPassword:', error)
    return res.status(500).json({ message: 'Failed to update password' })
  }
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page - 1) * limit

    const { count, rows } = await User.findAndCountAll({
      attributes: {
        exclude: ['passwordHash'], // 🔐 never send password
      },
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['roleId', 'roleName'],
          through: { attributes: [] }, // hide junction table
        }
      ],
      limit,
      offset,
      distinct: true, // important for pagination with include
      order: [['createdAt', 'DESC']],
    })

    return res.status(200).json({
      message: 'Users fetched successfully',
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    })
  }
}


export const updateUser = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction()

  try {

    const {
      userId,
      name,
      email,
      mobileNumber,
      //  password,
      username,
      roleIds,
   
    } = req.body

    // ✅ 1) Check user exists
    const existingUser = await User.findByPk(userId, { transaction })

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found.',
      })
    }

    // ✅ 2) Basic validations
    if (!name || !email) {
      return res.status(400).json({
        message: 'Mandatory fields missing (name, email).',
      })
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({
        message: 'roleIds must be a non-empty array.',
      })
    }

   

    // ✅ 3) Mobile validation
    if (mobileNumber) {
      const mobileRegex = /^[6-9][0-9]{9}$/
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(400).json({ message: 'Invalid mobile number.' })
      }
    }

    // ✅ 4) Check duplicate email/mobile/username (exclude current user)
    const duplicateUser = await User.findOne({
      where: {
        id: { [Op.ne]: userId },
        [Op.or]: [
          { email },
          ...(mobileNumber ? [{ mobileNumber }] : []),
          ...(username ? [{ username }] : []),
        ],
      },
      transaction,
    })

    if (duplicateUser) {
      return res.status(400).json({
        message: 'Email / Mobile / Username already registered.',
      })
    }

    // ✅ 5) Validate roleIds
    const roles = await Role.findAll({
      where: { roleId: { [Op.in]: roleIds } },
      transaction,
    })

    if (roles.length !== roleIds.length) {
      return res.status(400).json({
        message: 'Invalid roleIds: Some roleIds do not exist.',
      })
    }

   

    // ✅ 7) Update user fields
    await existingUser.update(
      {
        name,
        email,
        mobileNumber: mobileNumber || null,
        username: username || email,
        // ...(password && { passwordHash: password }), // Hook will hash
      },
      { transaction }
    )

    // ✅ 8) Remove old role mappings
    await UserRole.destroy({
      where: { userId },
      transaction,
    })

    // ✅ 9) Add new role mappings
    const userRolesPayload = roleIds.map((roleId: string) => ({
      userId,
      roleId,
    }))

    await UserRole.bulkCreate(userRolesPayload, { transaction })

    // ✅ 10) Remove old department mappings
 

    // ✅ 11) Add new department mappings


    

    // ✅ 12) Fetch updated user with associations
    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
       
      ],
      transaction,
    })

    await transaction.commit()

    return res.status(200).json({
      message: 'User updated successfully.',
      user: updatedUser,
    })
  } catch (error: any) {
    await transaction.rollback()
    console.error('updateUser error:', error)

    return res.status(500).json({
      message: 'Failed to update user.',
      error: error?.message || error,
    })
  }
}


// Reset Password - Verify Token & Update Password
// export const resetPassword = async (req: Request, res: Response) => {
//   const { token } = req.params
//   const { newPassword, confirmPassword } = req.body

//   // Check if both passwords are provided
//   if (!newPassword || !confirmPassword) {
//     return res
//       .status(400)
//       .json({ message: 'Both newPassword and confirmPassword are required.' })
//   }

//   // Check if newPassword matches confirmPassword
//   if (newPassword !== confirmPassword) {
//     return res.status(400).json({ message: 'Passwords do not match.' })
//   }

//   if (!token) {
//     return res.status(400).json({ message: 'Token is required.' })
//   }

//   try {
//     const usedToken = await UsedToken.findOne({ where: { token: token } })
//     if (usedToken) {
//       return res.status(400).json({ message: 'Token has already been used.' })
//     }

//     // Verify Token
//     const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string)

//     const user = await User.findByPk(decoded.id)

//     if (!user) {
//       return res.status(404).json({ message: 'Invalid or expired token' })
//     }

//     user.passwordHash = newPassword
//     await user.save()

//     await UsedToken.create({ token })

//     // Compare the entered password with the hashed password

//     return res.status(200).json({ message: 'Password updated successfully' })
//   } catch (error) {
//     console.error('Error:', error)
//     return res.status(400).json({ message: `Invalid or expired token `, error })
//   }
// }


// export const forgotPassword = async (req: Request, res: Response) => {
//   const { email } = req.body

//   try {
//     const user = await User.findOne({ where: { email } })

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' })
//     }

//     // Generate Reset Token (Valid for 15 mins)
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
//       expiresIn: '15m',
//     })

//     const resetLink = `${process.env.REDIRECT_URL}/forgot-password/${token}`

//     // Send Reset Email
//     await sendEmail(
//       user.email,
//       'Password Reset Request',
//       `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <style>
//             .email-container {
//               max-width: 600px;
//               margin: 0 auto;
//               padding: 20px;
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//               color: #333333;
//             }
//             .header {
//               background-color: #f8f9fa;
//               padding: 20px;
//               text-align: center;
//               border-radius: 5px;
//             }
//             .content {
//               padding: 20px;
//               background-color: #ffffff;
//               border-radius: 5px;
//               margin-top: 20px;
//             }
//             .button {
//               display: inline-block;
//               padding: 12px 24px;
//               background-color: #007bff;
//               color: #ffffff;
//               text-decoration: none;
//               border-radius: 5px;
//               margin: 20px 0;
//             }
//             .footer {
//               margin-top: 20px;
//               font-size: 12px;
//               color: #666666;
//               text-align: center;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="email-container">
//             <div class="header">
//               <h2>Password Reset Request</h2>
//             </div>
//             <div class="content">
//               <p>Hello,</p>
//               <p>We received a request to reset your password. Click the button below to create a new password. This link will expire in 15 minutes for security reasons.</p>
//               <div style="text-align: center;">
//                 <a href="${resetLink}" class="button">Reset Password</a>
//               </div>
//               <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
//               <p>Best regards,<br>Growth Hub Team</p>
//             </div>
//             <div class="footer">
//               <p>This is an automated message, please do not reply to this email.</p>
//             </div>
//           </div>
//         </body>
//       </html>
//       `
//     )

//     return res
//       .status(200)
//       .json({ message: 'Reset email sent successfully', token })
//   } catch (error) {
//     return res.status(500).json({ message: 'Error sending reset email', error })
//   }
// }
