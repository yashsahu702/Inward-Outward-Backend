import { Request } from 'express'
import { Role, User } from '../models'

export interface AuthUser extends User {
  Roles?: Role[]
}

export interface AuthRequest extends Request {
  user?: AuthUser
  authorizedWardIds?: string[]
}
