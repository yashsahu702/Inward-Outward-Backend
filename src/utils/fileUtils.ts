// src/utils/fileUtils.ts
import { Document } from '../models' // Adjust with your models
import { DocumentType } from '../models/enums'

// Function to get the file path from the DB based on fileType and id
export const getFilePathFromDB = async (
  fileType: string,
  id: string
): Promise<string | null> => {
  let filePath: string | null = null

  let document
  switch (fileType) {
    //Status Update: Building Photos
    case DocumentType.BUILDING_PHOTO:
      document = await Document.findOne({
        where: { id: id, documentType: DocumentType.BUILDING_PHOTO },
        attributes: ['filePath'],
      })
      if (document) {
        filePath = document.filePath || null
      }
      break

    //Planning Dept: First CC files
    // case DocumentType.FIRST_CC:
    //   document = await Document.findOne({
    //     where: { id: id, documentType: DocumentType.FIRST_CC },
    //     attributes: ['filePath'],
    //   })
    //   if (document) {
    //     filePath = document.filePath || null
    //   }
    //   break

    // //Planning Dept: Further CC files
    // case DocumentType.FURTHER_CC:
    //   document = await Document.findOne({
    //     where: { id: id, documentType: DocumentType.FURTHER_CC },
    //     attributes: ['filePath'],
    //   })
    //   if (document) {
    //     filePath = document.filePath || null
    //   }
    //   break

    // //Planning Dept: IOA files
    // case DocumentType.IOA:
    //   document = await Document.findOne({
    //     where: { id: id, documentType: DocumentType.IOA },
    //     attributes: ['filePath'],
    //   })
    //   if (document) {
    //     filePath = document.filePath || null
    //   }
    //   break

    // //Planning Dept: Occupancy files
    // case DocumentType.OCCUPANCY:
    //   document = await Document.findOne({
    //     where: { id: id, documentType: DocumentType.OCCUPANCY },
    //     attributes: ['filePath'],
    //   })
    //   if (document) {
    //     filePath = document.filePath || null
    //   }
    //   break

    // //Planning Dept: Concession/Plan Approval files
    // case DocumentType.CONCESSION_PLAN_APPROVAL:
    //   document = await Document.findOne({
    //     where: { id: id, documentType: DocumentType.CONCESSION_PLAN_APPROVAL },
    //     attributes: ['filePath'],
    //   })
    //   if (document) {
    //     filePath = document.filePath || null
    //   }
    //   break

    default:
      throw new Error('Invalid fileType')
  }

  return filePath
}
