import { Building, User } from '../../models'
import { UserType } from '../../models/enums'

const REDIRECT_URL = process.env.REDIRECT_URL
export const allowedUserType = ['Developer', 'Architect']

// type AllowedUserType = 'Department' | 'Architect'

export const welcomeEmailTemplateWithBuilding = (
  user: User,
  building: Building & { layout: { name: string } },
  userType: string
) => {
  try {
    if (
      !user?.name ||
      !building?.buildingName ||
      !building.layout?.name ||
      !REDIRECT_URL ||
      !userType
    ) {
      throw Error(`Incomplete user or building data to send ${userType} mail`)
    }

    if (!allowedUserType.includes(userType)) {
      throw Error(`Invalid user type "${userType}" to send welcome mail`)
    }

    return `
              <h2>Welcome to Mumbai Board Redevelopment Monitoring System</h2>
              <p>Dear ${user.name},</p>
              <p>Your account has been created as ${userType} for building "${building.buildingName}, ${building?.layout?.name}".</p>
              <br />
              <p>Your account login details are as under:</p>
              <ul>
              <li>Username: ${user.email}</li>
              <li>Temporary Password: Pass@123</li>
              <li>URL: ${REDIRECT_URL} </li>
              </ul>
              <p>Please login and change your password immediately for security purpose.</p>
              <p>You are required to login in the system and update the project status along with current site photos.</p>
              <br />
              <p>If you have any questions, please contact the support team.</p>
              <p><b>Please ignore if you have recieved your credentials already.</b></p>
            `
  } catch (error) {
    console.log(`Error while sending ${userType} welcome email ===>`, error)
  }
}

export const welcomeEmailTemplate = (user: User, userType: string) => {
  try {
    if (!REDIRECT_URL || !user?.name || !userType) {
      throw Error(`Incomplete user data to send welcome mail`)
    }

    if (!allowedUserType.includes(userType)) {
      throw Error(`Invalid user type "${userType}" to send welcome mail`)
    }

    return `
              <h2>Welcome to Mumbai Board Redevelopment Monitoring System</h2>
              <p>Dear ${user.name},</p>
              <p>Your account has been created as ${userType}.</p>
              <p>Your account login details are as under:</p>
              <ul>
              <li>Username: ${user.email}</li>
              <li>Temporary Password: Pass@123</li>
              <li>URL: ${REDIRECT_URL} </li>
              </ul>
              <p>Please login and change your password immediately for security purpose.</p>
              <p>You are required to login in the system and update the project status along with current site photos.</p>
              <p>If you have any questions, please contact the support team.</p>
              <p><b>NOTE: Please ignore if you have recieved your credentials already.</b></p>
            `
  } catch (error) {
    console.log(`Error while sending ${userType} welcome email ===>`, error)
  }
}

export const testTemplate = () => {
  try {
    return `
              <h2>Welcome to Mumbai Board Redevelopment Monitoring System</h2>
              <p>Dear user,</p>
              <p>This is a test email.</p>
              <p><b>NOTE: Please ignore if you have recieved your credentials already.</b></p>
            `
  } catch (error) {
    console.log(`Error while sending test email ===>`, error)
  }
}
