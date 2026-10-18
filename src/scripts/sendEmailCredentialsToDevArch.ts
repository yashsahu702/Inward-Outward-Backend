// src/scripts/sendEmailCredentialsToDevArch.ts

import { Op } from 'sequelize'
import { sequelize, User } from '../models'
import { allowedUserType, welcomeEmailTemplate } from '../utils/templates/email'
import { sendEmail } from '../config/mailer'

async function main() {
  try {
    // 1) Connect
    await sequelize.authenticate()
    console.log('DB connection established.')

    if (!allowedUserType?.length)
      throw Error('No department found to send mails to')

    console.log(
      `Initializing email sending process. Sending mail to ${allowedUserType?.join(
        ', '
      )} users.`
    )

    const DevelopersAndArchitects = await User.findAll({
      where: {
        department: {
          [Op.in]: allowedUserType,
        },
        // isVerified: false,
        // isVerified: true,
      },
      attributes: ['email', 'department', 'name'],
    })

    const totalEmailsSent: { user: User; message: string }[] = []
    const errorSendingEmails: {
      user: User
      message: string
      errorDetails?: any
    }[] = []
    const noTemplateFoundUsers: { user: User; message: string }[] = []

    //Send Welcome mail
    for (const user of DevelopersAndArchitects) {
      if (!user.department) {
        errorSendingEmails.push({
          user,
          message: `No department found for ${user.name} with email "${user.email}"`,
        })
        continue
      }

      if (allowedUserType.includes(user.department)) {
        const template = welcomeEmailTemplate(user, user.department)

        if (!template) {
          noTemplateFoundUsers.push({
            user,
            message: `No template found for ${user.department}`,
          })
          continue
        }

        await sendEmail(
          user.email,
          'Welcome to Mumbai Board Redevelopment Monitoring System',
          template
        )
          .then(() =>
            totalEmailsSent.push({
              user,
              message: `Email sent to ${user.department} - ${user.name} with email "${user.email}".`,
            })
          )
          .catch((err) => {
            errorSendingEmails.push({
              user,
              message: `Error sending welcome email for ${user.name} with email "${user.email}"`,
              errorDetails: err,
            })
            console.log(err)
          })
      }
    }

    // Log the emails whose template was not found
    for (const noTemplateLog of noTemplateFoundUsers) {
      console.log(noTemplateLog.message)
    }

    // Log the email messaages that threw error
    for (const errorEmail of errorSendingEmails) {
      console.log(errorEmail.message)
    }

    // Log the email messages that were sent successfully
    for (const emaillog of totalEmailsSent) {
      console.log(emaillog.message)
    }

    console.log('Email sent final report ==> ', {
      success: true,
      total_users: DevelopersAndArchitects?.map((user) => user.email),

      mail_sent_to_users: totalEmailsSent?.map(
        (emailData) => emailData.user.email
      ),
      error_sending_mail_for_users: errorSendingEmails?.map(
        (emailData) => emailData.user.email
      ),
      no_template_found_for_users: noTemplateFoundUsers?.map(
        (emailData) => emailData.user.email
      ),

      count: {
        total_users: DevelopersAndArchitects?.length,
        mail_sent_to_users: totalEmailsSent?.length,
        error_sending_mail_for_users: errorSendingEmails?.length,
        no_template_found_for_users: noTemplateFoundUsers?.length,
      },
      message: `Email sent successfully to ${totalEmailsSent?.length} out of ${DevelopersAndArchitects?.length} users`,
    })
  } catch (error) {
    console.error('ERROR in sendEmailCredentialsToDevArch.ts =>', error)
  } finally {
    // 4) Close DB connection
    await sequelize.close()
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
