import { Audit, SmsTemplate, sequelize } from '../models'
import { EntityType } from '../models/enums'

/**
 * This script will:
 *  1) Connect to DB
 *  2) Create/find the login OTP SMS template
 *  3) Close DB connection
 *
 * Usage:
 *    npx ts-node src/scripts/populateLoginOtpTemplate.ts
 */

async function main() {
  try {
    await sequelize.authenticate()
    console.log('DB connection established.')

    // Template data for login OTP
    const templateData = {
      templateId: '1107161520521898542',
      name: 'Login OTP Template',
      content: 'Your OTP is {{otp}} and is valid for 5 minutes MHADA',
      provider: 'orientnew' as const, // Using orient as default provider
      description: 'Template for sending login OTP to users',
      isActive: true,
    }

    // Find or create the template
    let template = await SmsTemplate.findOne({
      where: { templateId: templateData.templateId },
    })

    if (!template) {
      template = await SmsTemplate.create(templateData)
      console.log('Created SMS template => LOGIN_OTP')

      // Audit template creation
      await Audit.create({
        entity: EntityType.SMS_TEMPLATE,
        entityId: template.templateId,
        action: 'Create',
        performedBy: '00000000-0000-0000-0000-000000000000', // System user ID
        remarks: `SMS template "${template.name}" created via seed script.`,
        ipAddress: '127.0.0.1',
        timestamp: new Date(),
      })
    } else {
      console.log('SMS template => LOGIN_OTP already exists')
    }
  } catch (error) {
    console.error('ERROR in populateLoginOtpTemplate.ts =>', error)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
