import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const sendEmail = async (to: string, subject: string, html: string) => {
  // console.log('to=>>>', to)
  // console.log('html==>', html)
  // console.log('subject=>>>', subject)
  try {
    if (isValidEmail(to)) {
      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      })
      console.log(`Email sent to "${to}":`, result)
      return result
    } else {
      let message = {
        messageId: 'NA',
        email: to,
        error_message: `Invalid email found. Skipping to send email.`,
      }
      console.log(`Invalid email found:`, message)
      return message
    }
  } catch (error) {
    console.error(`Error sending email to "${to}" :`, error)
    throw error
  }
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const sendEmailWithAttachment = async (
  to: string,
  subject: string,
  html: string,
  attachmentBuffer: Buffer,
  filename: string
) => {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments: [
        {
          filename,
          content: attachmentBuffer,
        },
      ],
    })
    console.log('Email sent:', result)
    return result
  } catch (error) {
    console.error('Error sending email with attachment:', error)
    throw error
  }
}

export const getWelcomeEmailTemplate = (
  name: string,
  username: string,
  password: string
) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <h2 style="color: #2c3e50; text-align: center;">🎉 Welcome to Our System</h2>
      
      <p style="font-size: 16px; color: #555;">
        Hello <strong>${name}</strong>,
      </p>

      <p style="font-size: 15px; color: #555;">
        Your account has been successfully created. Below are your login credentials:
      </p>

      <div style="background: #f1f3f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
      </div>

      <p style="font-size: 14px; color: #777;">
        For security reasons, we recommend changing your password after your first login.
      </p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="https://yourdomain.com/login" 
           style="background-color: #3498db; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Login Now
        </a>
      </div>

      <p style="font-size: 13px; color: #999; margin-top: 30px; text-align: center;">
        If you did not request this account, please contact support immediately.
      </p>

    </div>
  </div>
  `
}
