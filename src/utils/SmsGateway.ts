import axios from 'axios'
import dotenv from 'dotenv'
import { SmsTemplateService } from '../services/SmsTemplateService'

dotenv.config()

export class SmsGateway {
  private static async orientSendSMS(
    phone: string,
    message: string,
    templateId: string
  ): Promise<string> {
    try {
      const response = await axios.get(process.env.ORIENT_SMS_API_URL!, {
        params: {
          UserID: process.env.ORIENT_SMS_USER_ID,
          Password: process.env.ORIENT_SMS_PASSWORD,
          SenderID: process.env.ORIENT_SMS_SENDER_ID,
          Phno: phone,
          Msg: message,
          EntityID: process.env.ORIENT_SMS_ENTITY_ID,
          TemplateID: templateId,
        },
      })
      return response.data
    } catch (error) {
      throw new Error(`Orient SMS sending failed: ${error}`)
    }
  }

  private static async ozoneSendSMS(
    phone: string,
    message: string,
    templateId: string
  ): Promise<string> {
    try {
      const response = await axios.get(process.env.OZONE_SMS_API_URL!, {
        params: {
          user: process.env.OZONE_SMS_USER,
          password: process.env.OZONE_SMS_PASSWORD,
          senderid: process.env.OZONE_SMS_SENDER_ID,
          channel: process.env.OZONE_SMS_CHANNEL,
          DCS: process.env.OZONE_SMS_DCS,
          flashsms: process.env.OZONE_SMS_FLASH_SMS,
          number: phone,
          text: message,
          route: process.env.OZONE_SMS_ROUTE,
          PEID: process.env.OZONE_SMS_PEID,
          DLTTemplateId: templateId,
        },
      })
      return response.data
    } catch (error) {
      throw new Error(`Ozone SMS sending failed: ${error}`)
    }
  }

  private static async orientNewSendSMS(
    phone: string,
    message: string,
    templateId: string
  ): Promise<string> {
    try {
      const response = await axios.get(process.env.ORIENTNEW_SMS_API_URL!, {
        params: {
          user: process.env.ORIENTNEW_SMS_USER,
          authkey: process.env.ORIENTNEW_SMS_AUTH_KEY,
          sender: process.env.ORIENTNEW_SMS_SENDER,
          mobile: phone,
          text: message,
          entityid: process.env.ORIENTNEW_SMS_ENTITY_ID,
          templateid: templateId,
          rpt: process.env.ORIENTNEW_SMS_RPT,
        },
      })
      return response.data
    } catch (error) {
      throw new Error(`OrientNew SMS sending failed: ${error}`)
    }
  }

  public static async sendSMS(
    phone: string,
    message: string,
    templateId: string,
    provider: 'orient' | 'ozone' | 'orientnew' = 'orient'
  ): Promise<string> {
    switch (provider) {
      case 'orient':
        return await this.orientSendSMS(phone, message, templateId)
      case 'ozone':
        return await this.ozoneSendSMS(phone, message, templateId)
      case 'orientnew':
        return await this.orientNewSendSMS(phone, message, templateId)
      default:
        throw new Error('Invalid SMS provider specified')
    }
  }

  public static async sendSMSWithTemplate(
    phone: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<string> {
    const processedTemplate = await SmsTemplateService.processTemplate(
      templateId,
      variables
    )

    if (!processedTemplate) {
      throw new Error('Template not found or inactive')
    }

    return await this.sendSMS(
      phone,
      processedTemplate.content,
      templateId,
      processedTemplate.provider as 'orient' | 'ozone' | 'orientnew'
    )
  }
}
