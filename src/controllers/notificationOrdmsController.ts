
import { NotificationOrdms, NotificationStatus, NotificationType } from '../models/notificationOrdms.model'
import { AuthRequest } from '../types/auth.types'
import { Request, Response } from 'express'
import { Op } from 'sequelize'

const statusRoleMap = {
    SUBMITTED_TO_CLERK: 'Clerk',
    RESUBMITTED_TO_CLERK: 'Clerk',
    REVERTED_BY_CLERK: 'DOE',
    REVERTED_BY_HO: 'DOE',
    APPROVED_BY_CLERK: 'HO',
    APPROVED_BY_HO: 'HOD',
  }

  const getMessage = (status: string, count: number) => {
    switch (status) {
      case 'SUBMITTED_TO_CLERK':
        return `${count} records submitted for approval`
      case 'RESUBMITTED_TO_CLERK':
        return `${count} records resubmitted for approval`
      case 'REVERTED_BY_CLERK':
        return `${count} records reverted by Clerk`
      case 'REVERTED_BY_HO':
        return `${count} records reverted by HO`
      case 'APPROVED_BY_CLERK':
        return `${count} records approved by Clerk, pending HO approval`
      case 'APPROVED_BY_HO':
        return `${count} records approved by HO, pending HOD approval`
      default:
        return `${count} records pending`
    }
  }

// export const generateNotifications = async () => {
//   try {
//     // Step 1: Get grouped record counts
//     const records = await Record.findAll({
//       attributes: ['status', 'departmentId'],
//       raw: true,
//     })

//     const grouped: any = {}
//     console.log("records.....",records)

//     // Step 2: Group by department + status
//     records.forEach((rec: any) => {
//       const key = `${rec.departmentId}_${rec.status}`
//       grouped[key] = (grouped[key] || 0) + 1
//     })

//     // Step 3: Process each group
//     console.log("grouped.....", grouped)
//     for (const key in grouped) {
//    //   const [departmentId, status] = key.split('_')
//       const firstUnderscoreIndex = key.indexOf('_')

//       const departmentId = key.substring(0, firstUnderscoreIndex)
//       const status = key.substring(firstUnderscoreIndex + 1)
//       const count = grouped[key]

//       const roleName = statusRoleMap[status as keyof typeof statusRoleMap]
//       if (!roleName) continue
     
//       // Step 4: Find users of that department + role
//       const users = await User.findAll({
//         include: [
//           {
//             model: Role,
//             as: 'roles',
//             where: { roleName: roleName },
//             attributes: [],
//           },
//           {
//             model: Department,
//             as: 'departments',
//             where: { id: departmentId },
//             attributes: [],
//           },
//         ],
//       })

//       console.log("users ......",users)
//       const department = await Department.findByPk(departmentId)
//       const departmentName = department?.departmentName || ''

//       // Step 5: Create notifications
//       for (const user of users) {
//         await NotificationOrdms.create({
//           userId: user.id,
//           departmentId,
//           type: NotificationType.RECORD,
//           message: `${departmentName} - ${getMessage(status, count)}`,
//           status: NotificationStatus.UNREAD,
//         })
//       }
//     }

//     console.log('✅ Notifications generated successfully')
//   } catch (error) {
//     console.error('❌ Notification generation failed', error)
//   }
// }

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(400).json({
        message: 'User ID not found',
      })
    }

    const notifications = await NotificationOrdms.findAll({
      where: { userId, status:NotificationStatus.UNREAD },
      order: [['createdAt', 'DESC']],
    })

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    })
  }
}


export const markNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body

    // ✅ Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids array is required',
      })
    }

    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }

    // ✅ Update notifications
    const [updatedCount] = await NotificationOrdms.update(
      { status: NotificationStatus.READ },
      {
        where: {
          id: {
            [Op.in]: ids,
          },
          userId, 
        },
      }
    )

    return res.status(200).json({
      success: true,
      message: `${updatedCount} notifications marked as READ`,
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
    })
  }
}