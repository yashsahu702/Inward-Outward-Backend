import { Express, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { getFilePathFromDB } from '../utils/fileUtils'
import { AuthRequest } from '../types/auth.types'
import multer from 'multer';
import {
  buildFilePath,
  generateTimestamp,
  getFolderNameForDocumentType,
} from '../utils/documentPaths'
import { v4 as uuidv4 } from 'uuid'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { Audit, Document } from '../models'
import { Transaction } from 'sequelize'
import { DocumentType, EntityType } from '../models/enums'

const pump = promisify(pipeline)



export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    // Example: /api/file?fileType=buildingPhoto&fileId=abc123
    const { fileType, fileId } = req.query
    if (!fileType || !fileId) {
      return res
        .status(400)
        .json({ message: 'fileType and fileId are required.' })
    }

    // Validate environment variables
    if (!process.env.UPLOAD_DIR) {
      throw new Error('UPLOAD_DIR environment variable must be set')
    }

    const filePathFromDB = await getFilePathFromDB(
      String(fileType),
      String(fileId)
    )
    if (!filePathFromDB) {
      return res.status(404).json({ message: 'File path not found in DB.' })
    }

    const uploadsDir = process.env.UPLOAD_DIR
    const normalizedRelativePath = filePathFromDB.split(/[\\/]/).join(path.sep)
    const absoluteFilePath = path.join(uploadsDir, normalizedRelativePath)

    // Security check: ensure the file path is within the uploads directory
    if (!absoluteFilePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Unauthorized file path' })
    }

    // Check if file exists
    try {
      await fs.promises.access(absoluteFilePath, fs.constants.R_OK)
    } catch (err) {
      console.error(`File not found or not readable: ${absoluteFilePath}`)
      return res.status(404).json({
        error: 'File not found on disk or not readable.',
        details:
          process.env.NODE_ENV === 'development' ? absoluteFilePath : undefined,
      })
    }

    // (Optional) Check user's roles, etc. if you want
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' })
    }
    // Some logic to ensure user can see the file:
    // if (!(await hasAccess(userId, String(fileType), String(fileId)))) {
    //   return res.status(403).json({ error: 'Access denied' })
    // }

    // Decide if it's an image
    const ext = path.extname(absoluteFilePath).toLowerCase()
    const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
    const isImage = imageExtensions.has(ext)

    if (!isImage) {
      // If not an image, force download
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${path.basename(absoluteFilePath)}"`
      )
    }

    // Send the file
    return res.sendFile(absoluteFilePath)
  } catch (error) {
    console.error('Error serving file:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
    })
  }
}
export const saveFiles = async (
  userId: string,
  userIp: string,
  file: Express.Multer.File,
  docType: DocumentType,

  entityId: string,
  avakId: string,
  transaction: Transaction
) => {
  const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR

  // Process each uploaded photo
  const fileOperations = []

  if (!UPLOAD_BASE_DIR) {
    throw Error('UPLOAD_DIR environment variable must be set')
  }
  if (!docType) {
    throw Error('Document Type must be set')
  }

  if (!file) {
    console.log('No File to attach')
    return
  }

  const folderName = getFolderNameForDocumentType(docType)
  const timeStr = generateTimestamp()
  const ext = path.extname(file.originalname)
  const randomSuffix = uuidv4().split('-')[0] // e.g. "3f7a"
  const newFileName = `${avakId}-${timeStr}-${randomSuffix}${ext}`

  const relativePath = buildFilePath(folderName, newFileName)
  const finalFilePath = path.join(UPLOAD_BASE_DIR, relativePath)
  const tempFilePath = file.path

  fileOperations.push({
    tempPath: tempFilePath,
    finalPath: finalFilePath,
  })

  console.log(`Processing photo: ${file.originalname} -> ${newFileName}`)

  // Ensure final folder structure exists
  await fs.promises.mkdir(path.dirname(finalFilePath), {
    recursive: true,
  })

  // Move the file from temp to final destination
  const readStream = fs.createReadStream(tempFilePath)
  const writeStream = fs.createWriteStream(finalFilePath)
  await pump(readStream, writeStream)
  console.log(
    `Successfully moved photo from ${tempFilePath} to ${finalFilePath}`
  )

  // Create a Document record for this status photo
  const document = await Document.create(
    {

      filePath: relativePath,
      fileName: file.originalname,
      documentType: docType,
    avakId:avakId

    },
    { transaction }
  )

  console.log(`Created document record with ID: ${document.id}`)

  // Audit the photo upload
  await Audit.create(
    {
      entity: EntityType.DOCUMENT,
      entityId: document.id,
      action: 'Create',
      performedBy: userId,
      remarks: `File - ${docType} with name "${document.fileName}" uploaded for building.`,
      ipAddress: userIp,
      timestamp: new Date(),
    },
    { transaction }
  )

  if (!document.id) {
    return null
  }


  return document;
}




export const getFilePath = async (req: AuthRequest, res: Response) => {
  try {
    // Extract fileType and fileId from the request body (since the frontend is POSTing)
    const { filePath } = req.body

    // Step 1: Get the file path from the database or business logic

    if (!filePath) {
      return res.status(404).json({ error: 'File not found.' })
    }

    const uploadsDir = process.env.UPLOAD_DIR

    // Step 2: Normalize file path separators so it works cross-platform
    const normalizedRelativePath = filePath.split(/[\\/]/).join(path.sep)


    // Step 3: Define the allowed base directory for file storage
    // const fileDirectory = path.resolve('uploads') // adjust if necessary
    // console.log('fileDirectory==>', fileDirectory)

    // Step 4: Build the absolute file path
    const absoluteFilePath = path.join(uploadsDir!, normalizedRelativePath)


    // Step 5: Security check - ensure the file is within the allowed directory
    if (!absoluteFilePath.startsWith(uploadsDir!)) {
      return res.status(403).json({ error: 'Unauthorized access to the file.' })
    }

    // Step 6: Check if the file exists
    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ error: 'File not found.' })
    }

    // Step 7: Authorization check - ensure the user is authenticated and allowed to access the file.
    const userId = req.user?.id
    const userWards = req.authorizedWardIds


    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' })
    }
    //  if (!(await hasAccessToFile(userId, fileType, fileId, userWards))) {
    //   return res
    //     .status(403)
    //     .json({ error: 'Unauthorized to access this file.' })
    // }

    // Step 8: Set headers to force the browser to download the file (instead of displaying raw binary)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${path.basename(absoluteFilePath)}"`
    )

    // Step 9: Send the file
    return res.sendFile(absoluteFilePath)
  } catch (error) {
    console.error('Error retrieving file:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


export const replaceDocumentFile = async (
  documentId: string,
  file: Express.Multer.File,
  recordId: string,
  transaction: Transaction
) => {
  const UPLOAD_DIR = process.env.UPLOAD_DIR

  if (!UPLOAD_DIR) {
    throw new Error('UPLOAD_DIR not configured')
  }

  const existingDocument = await Document.findByPk(documentId)

  if (!existingDocument) {
    throw new Error(`Document with id ${documentId} not found`)
  }

  // 🔴 1️⃣ Delete old file from storage
  const oldFilePath = path.join(UPLOAD_DIR, existingDocument.filePath)

  if (fs.existsSync(oldFilePath)) {
    fs.unlinkSync(oldFilePath)
  }

  // 🟢 2️⃣ Generate new file path
  const folderName = getFolderNameForDocumentType(
    existingDocument.documentType
  )

  const timeStr = generateTimestamp()
  const ext = path.extname(file.originalname)
  const newFileName = `${recordId}-${timeStr}${ext}`

  const relativePath = buildFilePath(folderName, newFileName)
  const finalPath = path.join(UPLOAD_DIR, relativePath)

  await fs.promises.mkdir(path.dirname(finalPath), {
    recursive: true,
  })

  // 🟢 3️⃣ Move new file
  await pump(
    fs.createReadStream(file.path),
    fs.createWriteStream(finalPath)
  )

  // 🟢 4️⃣ Update DB
  await existingDocument.update(
    {
      filePath: relativePath,
      fileName: file.originalname,
    },
    { transaction }
  )

  return existingDocument
}
