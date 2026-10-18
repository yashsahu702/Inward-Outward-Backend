// src/controllers/roleController.ts

import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Audit, Role } from '../models'
import { EntityType } from '../models/enums'
import { AuthRequest } from '../types/auth.types'

/**
 * Create a new Role
 */
export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { roleName } = req.body

    if (!roleName) {
      return res.status(400).json({ error: 'roleName is required.' })
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { roleName } })
    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists.' })
    }

    const role = await Role.create({ roleName })

    // Optionally log audit
    await Audit.create({
      entity: EntityType.ROLE,
      entityId: role.roleId,
      action: 'Create',
      performedBy: req.user?.id || '00000000-0000-0000-0000-000000000000',
      remarks: `Role "${role.roleName}" created.`,
      ipAddress: req.ip ? req.ip : '',
      timestamp: new Date(),
    })

    res.status(201).json(role)
  } catch (error) {
    console.error('Error creating role:', error)
    res.status(500).json({ error: 'Failed to create role.' })
  }
}

/**
 * Get all Roles
 */
export const getRoles = async (req: AuthRequest, res: Response) => {
  try {
    const roles = await Role.findAll()
    res.status(200).json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({ error: 'Failed to fetch roles.' })
  }
}

/**
 * Get a Role by ID
 */
// export const getRoleById = async (req: AuthRequest, res: Response) => {
//   try {
//     const { id } = req.params

//     const role = await Role.findByPk(id, {
//       include: [
//         {
//           model: Feature,
//           as: 'features',
//           through: { attributes: [] },
//         },
//       ],
//     })
//     if (!role) {
//       return res.status(404).json({ error: 'Role not found.' })
//     }

//     res.status(200).json(role)
//   } catch (error) {
//     console.error('Error fetching role:', error)
//     res.status(500).json({ error: 'Failed to fetch role.' })
//   }
// }

/**
 * Update a Role
 */
export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { roleName } = req.body

    const role = await Role.findByPk(id)
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' })
    }

    if (roleName) {
      role.roleName = roleName
    }

    await role.save()

    // Optionally log audit
    await Audit.create({

      entity: EntityType.ZONE, // adjust as appropriate
      entityId: role.roleId,
      action: 'Update',
      performedBy: req.user?.id || '00000000-0000-0000-0000-000000000000',
      remarks: `Role "${role.roleName}" updated.`,
      ipAddress: req.ip ? req.ip : '',
      timestamp: new Date(),
    })

    res.status(200).json(role)
  } catch (error) {
    console.error('Error updating role:', error)
    res.status(500).json({ error: 'Failed to update role.' })
  }
}

/**
 * Delete a Role
 */
export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const role = await Role.findByPk(id)
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' })
    }

    await role.destroy()

    // Optionally log audit
    await Audit.create({

      entity: EntityType.ZONE, // or whichever entity
      entityId: role.roleId,
      action: 'Delete',
      performedBy: req.user?.id || '00000000-0000-0000-0000-000000000000',
      remarks: `Role "${role.roleName}" deleted.`,
      ipAddress: req.ip ? req.ip : '',
      timestamp: new Date(),
    })

    res.status(200).json({ message: 'Role deleted successfully.' })
  } catch (error) {
    console.error('Error deleting role:', error)
    res.status(500).json({ error: 'Failed to delete role.' })
  }
}

/**
 * Assign Features to a Role
 */