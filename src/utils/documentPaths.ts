// src/utils/documentPaths.ts
import path from 'path'
import { format } from 'date-fns'
import { DocumentType } from '../models/enums'

export function getFolderNameForDocumentType(docType: DocumentType): string {
  switch (docType) {
    case DocumentType.BUILDING_PHOTO:
      return 'Photo'
    case DocumentType.NOC:
      return 'Noc'
    case DocumentType.BUILDING_STATUS_PHOTO:
      return 'Building-Status-Photo'
    case DocumentType.IOD:
      return 'IOD'
    case DocumentType.SURPLUS_AREA:
      return 'Surplus-Area'
    case DocumentType.BUILDING_CC:
      return 'Building-CC'
    case DocumentType.BUILDING_OC:
      return 'Building-OC'
    default:
      return 'other'
  }
}

export function generateTimestamp(): string {
  return format(new Date(), 'yyyyMMdd-HHmm')
}

export function buildFilePath(folderName: string, fileName: string): string {
  // e.g. 'Panchnama/something-20250127.pdf'
  return path.join(folderName, fileName)
}
