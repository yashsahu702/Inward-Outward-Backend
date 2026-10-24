import path from 'path'
import './config/env'

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

console.log(
  'NODE_ENV =',
  process.env.NODE_ENV,
  `-> loading .env.${process.env.NODE_ENV}`
)

import cors from 'cors'
import express from 'express'
import { connectDatabase } from './config/database'
import { requestLogger } from './utils/logger'
import { verifyDirectoryPermissions } from './utils/directoryChecks'
import cron from 'node-cron'
// import { generateNotifications } from './controllers/notificationOrdmsController'


import authRoutes from './routes/authRoutes'
import fileRoutes from './routes/fileRoutes'
import roleRoutes from './routes/roleRoutes'
import departmentRoutes from './routes/departmentRoutes'
//import { notificationService } from './services/notificationService'
import { testEmailConfig } from './utils/emailConfigTester'
import subjectRoutes from './routes/subjectRoutes'
import branchRoutes from './routes/branchRoutes'
import sectionRoutes from './routes/sectionRoutes'
import userSectionRoutes from './routes/userSectionRoutes'
import senderRoutes from './routes/senderRoutes'
import avakRoutes from './routes/avakRoutes'
import notificationRoutes from './routes/notificationOrdmsRoutes'
import javakRoutes from './routes/javakRoutes';
const app = express()
const port = process.env.PORT || 5050

// Verify directory permissions before starting the server
try {
  verifyDirectoryPermissions()
} catch (error) {
  console.error('❌ Critical Error: Directory permission checks failed')
  console.error(error)
  process.exit(1) // Exit if directory permissions are not correct
}

app.use(
  cors({
    // origin: [
    //   'http://localhost:3000',
    //   'http://landreg.abcanview.net',
    //   'https://landreg.abcanview.net',
    // ],
    origin: '*',
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'],
    exposedHeaders: ['Content-Disposition'],
  })
)

connectDatabase()



// Setup view engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../views'))

// Middleware to parse JSON bodies
app.use(express.json())

// Middleware for serving static files
// app.use(express.static(path.join(__dirname, '../public')))
app.use('/public', express.static('public'))

// Middleware for logging requests
app.use(requestLogger)

// // Use the modularized routes
testEmailConfig()

app.use('/auth', authRoutes)
app.use('/files', fileRoutes)
app.use('/departments', departmentRoutes)
app.use('/roles', roleRoutes)
app.use('/notification',  notificationRoutes )
app.use('/api/subjects', subjectRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/sections', sectionRoutes)
app.use('/api/user-sections', userSectionRoutes)
app.use('/api/senders', senderRoutes)
app.use('/api/avak', avakRoutes)
app.use('/api/javak', javakRoutes);
// const startNotificationJob = async () => {
//   console.log('🚀 Running Notification Job on Startup')
//   await generateNotifications()
// }

// startNotificationJob()

// Runs at 6:00 PM every day
// cron.schedule('0 18 * * *', async () => {
//   console.log('⏰ Running Notification Cron (6 PM)')
//   await generateNotifications()
// })


// Initialize CRON jobs

// console.log("Stating notification....");
// notificationService.initCronJobs()


// notificationService.generateStatusUpdateNotifications()
//   .then(() => console.log('Notification check complete 1st.'))
//   .catch(err => console.error('Error during notification check:', err))


// notificationService.generateStatusUpdateNotificationsForDepartmentUser()
//   .then(() => console.log('Notification check complete 2nd.'))
//   .catch(err => console.error('Error during notification check:', err))


// Main index route
app.get('/', (req, res) => {
  console.log('App Name ==>', process.env.APP_NAME)
  res.render('index', { appName: process.env.APP_NAME })
})

// Error handling middleware
// app.use(
//   (
//     err: Error,
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction
//   ) => {
//     console.error(err.stack)
//     res.status(500).send('Something broke!')
//   }
// )



app.use(
  (err: Error | multer.MulterError, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors (e.g., file size, file limit)
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err.message.includes('Only image files')) {
      // Handle custom file validation error from multer filter
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Something broke!' });
  }
);


// Start the server
app.listen(port, () => {
  console.log(process.env.NODE_ENV)
  console.log(`Server running on http://localhost:${port}/`)
})

export default app
