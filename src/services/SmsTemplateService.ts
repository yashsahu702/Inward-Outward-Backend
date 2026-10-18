import { SmsTemplate } from '../models'
import { SmsTemplateCreationAttributes } from '../models/smsTemplate.model'

export class SmsTemplateService {
  public static async createTemplate(
    templateData: Omit<SmsTemplateCreationAttributes, 'id'>
  ): Promise<SmsTemplate> {
    return await SmsTemplate.create(templateData)
  }

  public static async getTemplateById(
    templateId: string
  ): Promise<SmsTemplate | null> {
    return await SmsTemplate.findOne({
      where: {
        templateId,
        isActive: true,
      },
    })
  }

  public static async updateTemplate(
    templateId: string,
    updateData: Partial<SmsTemplate>
  ): Promise<SmsTemplate | null> {
    const [numAffected, [updatedTemplate]] = await SmsTemplate.update(
      updateData,
      {
        where: { templateId },
        returning: true,
      }
    )

    return numAffected > 0 ? updatedTemplate : null
  }

  public static async deleteTemplate(templateId: string): Promise<boolean> {
    const result = await SmsTemplate.update(
      { isActive: false },
      {
        where: { templateId },
      }
    )
    return result[0] > 0
  }

  public static async getAllTemplates(): Promise<SmsTemplate[]> {
    return await SmsTemplate.findAll({
      where: { isActive: true },
    })
  }

  public static async processTemplate(
    templateId: string,
    variables: Record<string, string>
  ): Promise<{ content: string; provider: string } | null> {
    const template = await this.getTemplateById(templateId)

    if (!template) {
      return null
    }

    let processedContent = template.content

    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      processedContent = processedContent.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value
      )
    })

    return {
      content: processedContent,
      provider: template.provider,
    }
  }
}
