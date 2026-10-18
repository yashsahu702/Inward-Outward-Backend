import fs from 'fs'
import path from 'path'

interface DirectoryCheck {
  path: string
  description: string
}

export function verifyDirectoryPermissions() {
  if (!process.env.UPLOAD_DIR || !process.env.TEMP_UPLOAD_DIR) {
    throw new Error(
      'UPLOAD_DIR and TEMP_UPLOAD_DIR environment variables must be set'
    )
  }

  const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR
  const TEMP_UPLOAD_DIR = process.env.TEMP_UPLOAD_DIR
  const FINAL_UPLOAD_DIR = path.join(UPLOAD_BASE_DIR, 'status_photos')

  const directoriesToCheck: DirectoryCheck[] = [
    { path: UPLOAD_BASE_DIR, description: 'Main Upload Directory' },
    { path: TEMP_UPLOAD_DIR, description: 'Temporary Upload Directory' },
    { path: FINAL_UPLOAD_DIR, description: 'Status Photos Directory' },
  ]

  const errors: string[] = []
  const createdDirs: string[] = []

  for (const dir of directoriesToCheck) {
    try {
      // Check if directory exists
      const exists = fs.existsSync(dir.path)
      if (!exists) {
        console.log(`Creating directory: ${dir.description} at ${dir.path}`)
        // Create directory if it doesn't exist
        fs.mkdirSync(dir.path, { recursive: true })
        createdDirs.push(dir.description)
      }

      // Verify the path is actually a directory
      const stats = fs.statSync(dir.path)
      if (!stats.isDirectory()) {
        errors.push(
          `Path exists but is not a directory: ${dir.description} at ${dir.path}`
        )
        continue
      }

      // Check read permission
      try {
        fs.accessSync(dir.path, fs.constants.R_OK)
      } catch (err) {
        errors.push(`No read permission for ${dir.description} at ${dir.path}`)
      }

      // Check write permission
      try {
        const testFile = path.join(dir.path, '.permission-test')
        fs.writeFileSync(testFile, 'test')
        fs.unlinkSync(testFile)
      } catch (err) {
        errors.push(`No write permission for ${dir.description} at ${dir.path}`)
      }

      // Check execute (traverse) permission
      try {
        fs.accessSync(dir.path, fs.constants.X_OK)
      } catch (err) {
        errors.push(
          `No execute permission for ${dir.description} at ${dir.path}`
        )
      }
    } catch (err: any) {
      errors.push(
        `Failed to create or access ${dir.description} at ${dir.path}: ${
          err?.message || 'Unknown error'
        }`
      )
    }
  }

  // Clean up old temporary files in TEMP_UPLOAD_DIR
  try {
    const tempFiles = fs.readdirSync(TEMP_UPLOAD_DIR)
    const now = Date.now()
    let cleanedFiles = 0
    for (const file of tempFiles) {
      const filePath = path.join(TEMP_UPLOAD_DIR, file)
      try {
        const stats = fs.statSync(filePath)
        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          // 24 hours
          fs.unlinkSync(filePath)
          cleanedFiles++
        }
      } catch (err) {
        console.error(`Failed to process temp file ${file}:`, err)
      }
    }
    if (cleanedFiles > 0) {
      console.log(`Cleaned up ${cleanedFiles} old temporary files`)
    }
  } catch (err: any) {
    errors.push(
      `Failed to clean up temporary files: ${err?.message || 'Unknown error'}`
    )
  }

  if (errors.length > 0) {
    console.error('Directory Permission Checks Failed:')
    errors.forEach((error) => console.error(`- ${error}`))
    throw new Error(
      'Directory permission checks failed. Check console for details.'
    )
  }

  // Log successful directory creation
  if (createdDirs.length > 0) {
    console.log('✅ Created the following directories:')
    createdDirs.forEach((dir) => console.log(`  - ${dir}`))
  }

  console.log('✅ All directory permissions verified successfully')
  return true
}
