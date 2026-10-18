// import { Op } from 'sequelize'
// import {

//   User,

//   Role,
  
//   sequelize,
// } from '../models'
// import {
//   NotificationType,
//   NotificationStatus,
// } from '../models/notification.model'
// import { sendEmail } from '../config/mailer'
// import { UserType } from '../models/enums'
// import cron from 'node-cron'

// import { UserWard } from '../models/userWard.model'


// interface DeveloperUser extends User {
//   email: string
// }

// interface BuildingWithDeveloper extends Omit<Building, 'developer'> {
//   developer?: DeveloperUser | null
//   // certificates?: BuildingCertificate[]
//   statusUpdates?: BuildingStatusUpdate[]
// }

// // Check for buildings that need status updates
// // private async checkStatusUpdatesDue() {
// //   try {
// //     const threemonthsAgo = new Date()
// //     threemonthsAgo.setMonth(threemonthsAgo.getMonth() - 3)
// //     const now = new Date()

// //     // Find buildings with CC and check for status updates
// //     const buildings = (await Building.findAll({
// //       include: [
// //         {
// //           model: User,
// //           as: 'developer',
// //           required: false,
// //           include: [
// //             {
// //               model: Role,
// //               as: 'roles',
// //               where: {
// //                 roleName: {
// //                   [Op.in]: [UserType.DEVELOPER, UserType.ARCHITECT],
// //                 },
// //               },
// //             },
// //           ],
// //         },
// //         // {
// //         //   model: BuildingCertificate,
// //         //   as: 'certificates',
// //         //   required: true,
// //         //   where: {
// //         //     ccDate: {
// //         //       [Op.lt]: threemonthsAgo,
// //         //     },
// //         //   },
// //         //   order: [['ccDate', 'ASC']],
// //         //   limit: 1,
// //         // }, 
// //         {
// //           model: BuildingStatusUpdate,
// //           as: 'statusUpdates',
// //           required: false,
// //           where: {
// //             [Op.or]: [
// //               { createdAt: { [Op.lt]: threemonthsAgo } },
// //               { createdAt: null },
// //             ],
// //           },
// //           order: [['createdAt', 'DESC']],
// //           limit: 1,
// //         },
// //       ],
// //     })) as BuildingWithDeveloper[]

// //     for (const building of buildings) {
// //       if (!building.developerId || !building.developer) {
// //         console.log(
// //           `Building ${building.id} has no developer assigned, skipping notification`
// //         )
// //         continue
// //       }

// //       const dueDate = new Date()
// //       dueDate.setDate(dueDate.getDate() + 7) // 7 days from now

// //       // Check if there's an existing unread notification for this building
// //       const existingNotification = await Notification.findOne({
// //         where: {
// //           buildingId: building.id,
// //           type: NotificationType.STATUS_UPDATE_DUE,
// //           status: NotificationStatus.UNREAD,
// //         },
// //       })

// //       if (existingNotification) {
// //         // If the due date has passed, update the notification message
// //         const notificationDueDate = existingNotification.dueDate
// //         if (notificationDueDate && new Date(notificationDueDate) < now) {
// //           await existingNotification.update({
// //             message: `OVERDUE: Status update for building ${building.buildingName
// //               } was due on ${notificationDueDate.toLocaleDateString()}. Please update immediately.`,
// //             isEmailSent: false,
// //             isSMSSent: false,
// //           })

// //           // Send overdue email to developer
// //           // await this.sendStatusUpdateReminder(
// //           //   building.developer.email,
// //           //   building.buildingName,
// //           //   notificationDueDate,
// //           //   true
// //           // )
// //         }
// //         continue
// //       }

// //       // Create notification for developer
// //       await Notification.create({
// //         userId: building.developerId,
// //         buildingId: building.id,
// //         type: NotificationType.STATUS_UPDATE_DUE,
// //         message: `Status update for building ${building.buildingName} is due in 7 days.`,
// //         status: NotificationStatus.UNREAD,
// //         dueDate,
// //         isEmailSent: false,
// //         isSMSSent: false,
// //       })

// //       // Send email to developer
// //       // await this.sendStatusUpdateReminder(
// //       //   building.developer.email,
// //       //   building.buildingName,
// //       //   dueDate,
// //       //   false
// //       // )

// //       // Create notifications for department users
// //       const departmentUsers = await User.findAll({
// //         include: [
// //           {
// //             model: Role,
// //             as: 'roles',
// //             where: {
// //               roleName: {
// //                 [Op.in]: ['DeputyEng', 'ResidentExecEng', 'DeputyChiefEng'],
// //               },
// //             },
// //           },
// //         ],
// //       })

// //       for (const user of departmentUsers) {
// //         await Notification.create({
// //           userId: user.id,
// //           buildingId: building.id,
// //           type: NotificationType.STATUS_UPDATE_DUE,
// //           message: `Status update for building ${building.buildingName} is due in 7 days. Developer has been notified.`,
// //           status: NotificationStatus.UNREAD,
// //           dueDate,
// //           isEmailSent: false,
// //           isSMSSent: false,
// //         })
// //       }
// //     }
// //   } catch (error) {
// //     console.error('Error in checkStatusUpdatesDue:', error)
// //   }
// // }


// // private async sendStatusUpdateReminder(
// //   email: string,
// //   buildingName: string,
// //   dueDate: Date,
// //   isOverdue: boolean = false
// // ): Promise<void> {
// //   const subject = isOverdue
// //     ? `OVERDUE: Status Update Required for ${buildingName}`
// //     : `Reminder: Status Update Due for ${buildingName}`

// //   const html = isOverdue
// //     ? `
// //       <h2>OVERDUE Status Update</h2>
// //       <p>The status update for building "${buildingName}" was due on ${dueDate.toLocaleDateString()}.</p>
// //       <p>This update is now overdue. Please log in to the system and update the building status immediately.</p>
// //       <p>If you have any questions or issues, please contact the planning department urgently.</p>
// //     `
// //     : `
// //       <h2>Status Update Reminder</h2>
// //       <p>This is a reminder that a status update for building "${buildingName}" is due on ${dueDate.toLocaleDateString()}.</p>
// //       <p>Please log in to the system and update the building status before the due date.</p>
// //       <p>If you have any questions, please contact the planning department.</p>
// //     `

// //   await sendEmail(email, subject, html)
// // }

// // type BuildingWithStatus = Building & {
// //   buildingStatus?: BuildingStatusUpdate[];
// // };

// // class NotificationService {


// //   // Initialize CRON jobs
// //   public initCronJobs() {
// //     // Run twice a day at 9 AM and 3 PM
// //     // cron.schedule('0 9,15 * * *', async () => {
// //     //   console.log('Running status update check...')
// //     //   await this.checkStatusUpdatesDue()
// //     // })


// //     // Run on 25th day of every month at 00:00
// //     cron.schedule('0 0 25 * *', async () => {
// //       try {
// //         console.log('Running monthly status update notification jobs...');

// //         await notificationService.generateStatusUpdateNotifications();
// //         await notificationService.generateStatusUpdateNotificationsForDepartmentUser();

// //         console.log('Monthly status notification jobs completed successfully.');
// //       } catch (error) {
// //         console.error('Error in monthly status notification cron job:', error);
// //         // Optionally: log to an external service like Sentry, Datadog, etc.
// //       }
// //     });
// //   }




//   public async generateStatusUpdateNotifications() {
//     const oneMonthAgo = new Date()
//     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

//     // Step 1: Find buildings needing status update
//     // const buildings = await Building.findAll({
//     //   include: [
//     //     {
//     //       model: BuildingStatusUpdate,
//     //       as: 'buildingStatus',
//     //       required: false,
//     //       // where: {
//     //       //   isActive: true,
//     //       //   createdAt: {
//     //       //     [Op.or]: [
//     //       //       { [Op.lt]: oneMonthAgo },
//     //       //       { [Op.eq]: null }, // Status not created yet
//     //       //     ],
//     //       //   },
//     //       // },
//     //       order: [['createdAt', 'DESC']],
//     //       limit: 1,
//     //     },
//     //   ],
//     // })

//     // const dueBuildings = buildings.filter(b => {
//     //   const latestStatus = b.buildingStatus?.[0];
//     //   return !latestStatus || new Date(latestStatus.createdAt) < oneMonthAgo;
//     // });

//     const buildings: BuildingWithStatus[] = await Building.findAll({
//       include: [
//         {
//           model: BuildingStatusUpdate,
//           as: 'buildingStatus',
//           required: false,
//           order: [['createdAt', 'DESC']],
//           where: { isActive: true },
//           limit: 1,
//         },
//       ],
//     });

//     const dueBuildings = buildings.filter(b => {
//       const latestStatus = b.buildingStatus?.[0];
//       return !latestStatus || new Date(latestStatus.createdAt) < oneMonthAgo;
//     });

//     for (const building of dueBuildings) {
//       const wardId = building.wardId

//       // Step 2: Find users assigned to this ward
//       const userWards = await UserWard.findAll({ where: { wardId } })

//       let developer;
//       if (building.developerId) {

//         developer = await User.findByPk(building.developerId);

//       }



//       for (const uw of userWards) {
//         const existingNotification = await Notification.findOne({
//           where: {
//             userId: uw.userId,
//             buildingId: building.id,
//             type: NotificationType.STATUS_NOT_UPDATED,
//             status: NotificationStatus.UNREAD,
//           },
//         })

//         const message = `Developer ${developer?.name} has not updated their status yet for Building "${building.buildingName}".`;
//         // Step 3: Avoid duplicate notifications
//         if (!existingNotification) {
//           await Notification.create({
//             userId: uw.userId,
//             buildingId: building.id,
//             type: NotificationType.STATUS_NOT_UPDATED,
//             message,
//             status: NotificationStatus.UNREAD,
//             dueDate: null,
//             isEmailSent: false,
//             isSMSSent: false,
//           })
//         }
//       }
//     }
//   }


//   public async generateStatusUpdateNotificationsForDepartmentUser() {
//     const oneMonthAgo = new Date()
//     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

//     // Step 1: Find buildings that had a status update in the last 1 month
//     const buildings: BuildingWithStatus[] = await Building.findAll({
//       include: [
//         {
//           model: BuildingStatusUpdate,
//           as: 'buildingStatus',
//           required: false,
//           order: [['createdAt', 'DESC']],
//           where: {
//             isActive: true,
//             createdAt: { [Op.gte]: oneMonthAgo }
//           },
//           limit: 1,
//         },
//       ],
//     });

//     const recentlyUpdatedBuildings = buildings.filter(b => {
//       const latestStatus = b.buildingStatus?.[0];
//       return latestStatus && new Date(latestStatus.createdAt) >= oneMonthAgo;
//     });

//     for (const building of recentlyUpdatedBuildings) {
//       const wardId = building.wardId;

//       // Step 2: Find users assigned to this ward
//       const userWards = await UserWard.findAll({ where: { wardId } });

//       let developer;
//       if (building.developerId) {
//         developer = await User.findByPk(building.developerId);
//       }

//       for (const uw of userWards) {
//         const existingNotification = await Notification.findOne({
//           where: {
//             userId: uw.userId,
//             buildingId: building.id,
//             type: NotificationType.STATUS_UPDATED,  // New type to distinguish
//             status: NotificationStatus.UNREAD,
//           },
//         });

//         const message = `Developer "${developer?.name}" has updated their status for Building "${building.buildingName}".`;

//         // Step 3: Avoid duplicate notifications
//         if (!existingNotification) {
//           await Notification.create({
//             userId: uw.userId,
//             buildingId: building.id,
//             type: NotificationType.STATUS_UPDATED, // Define this enum if not already
//             message,
//             status: NotificationStatus.UNREAD,
//             dueDate: null,
//             isEmailSent: false,
//             isSMSSent: false,
//           });
//         }
//       }
//     }
//   }


//   // Get notifications for a user
//   public async getUserNotifications(userId: string) {
//     return await Notification.findAll({
//       where: {
//         userId,
//         status: NotificationStatus.UNREAD,
//       },
//       order: [['createdAt', 'DESC']],
//       include: [
//         {
//           model: Building,
//           as: 'building',
//           attributes: ['id', 'buildingName'],
//         },
//       ],
//     })
//   }

//   // Mark notification as read
//   public async markNotificationAsRead(notificationId: string) {
//     await Notification.update(
//       { status: NotificationStatus.READ },
//       {
//         where: {
//           id: notificationId,
//         },
//       }
//     )
//   }
// }

// export const notificationService = new NotificationService()
