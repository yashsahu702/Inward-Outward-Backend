// A simple test function you can call to check email configuration
import { transporter } from '../config/mailer'

export const testEmailConfig = async () => {
  try {
    console.log('Testing email configuration with these settings:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USERNAME ? '****' : 'undefined',
      from: process.env.EMAIL_FROM,
    })

    const info = await transporter.verify()
    console.log('Email configuration verified:', info)
    return true
  } catch (error) {
    console.error('Email configuration test failed:', error)
    return false
  }
}
