import fs from 'fs'

const readFilePromise = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

readFilePromise('sample.txt')
  .then((data: string) => {
    console.log('File content:', data)
  })
  .catch((err: Error) => {
    console.error('Error reading the file:', err)
  })

const readFileSync = async (filePath: string): Promise<void> => {
  try {
    const data = await readFilePromise(filePath)
    console.log('File content with async/await:', data)
  } catch (err) {
    console.error('Error reading the file with async/await:', err)
  }
}

// Usage
readFileSync('sample.txt')
