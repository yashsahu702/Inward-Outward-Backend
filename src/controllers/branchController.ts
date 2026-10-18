
import { Response } from 'express'
import { Branch } from '../models/branch.model'
import { Department } from '../models/department.model'
import { AuthRequest } from '../types/auth.types'

export const createBranch = async (req: AuthRequest, res: Response) => {
    try {
        const {
            branchName,
            branchCode,
            departmentId,
            activeFlag,
        } = req.body

        const userId = req.user?.id

        if (!branchName || !branchCode || !departmentId) {
            return res.status(400).json({
                message:
                    'Branch name, branch code and department ID are required',
            })
        }

        // Check whether the department exists
        const department = await Department.findByPk(departmentId)

        if (!department) {
            return res.status(404).json({
                message: 'Department not found',
            })
        }

        // Check duplicate branch code within the same department
        const existingBranch = await Branch.findOne({
            where: {
                branchCode,
                departmentId,
            },
        })

        if (existingBranch) {
            return res.status(400).json({
                message:
                    'Branch code already exists in this department',
            })
        }

        const branch = await Branch.create({
            branchName,
            branchCode,
            departmentId,
            activeFlag: activeFlag ?? true,
            createdBy: userId ?? null,
            createdOn: new Date(),
        })

        return res.status(201).json({
            message: 'Branch created successfully',
            data: branch,
        })
    } catch (error: any) {
        console.error('createBranch error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const updateBranch = async (req: AuthRequest, res: Response) => {
    try {
        const {
            id,
            branchName,
            branchCode,
            departmentId,
            activeFlag,
        } = req.body

        const userId = req.user?.id

        if (!id) {
            return res.status(400).json({
                message: 'Branch ID is required',
            })
        }

        const branch = await Branch.findByPk(id)

        if (!branch) {
            return res.status(404).json({
                message: 'Branch not found',
            })
        }

        const newDepartmentId = departmentId ?? branch.departmentId
        const newBranchCode = branchCode ?? branch.branchCode

        // Validate department if it is being changed
        if (departmentId && departmentId !== branch.departmentId) {
            const department = await Department.findByPk(departmentId)

            if (!department) {
                return res.status(404).json({
                    message: 'Department not found',
                })
            }
        }

        // Check duplicate branch code within the target department
        if (
            newBranchCode !== branch.branchCode ||
            newDepartmentId !== branch.departmentId
        ) {
            const existingBranch = await Branch.findOne({
                where: {
                    branchCode: newBranchCode,
                    departmentId: newDepartmentId,
                },
            })

            if (existingBranch && existingBranch.id !== branch.id) {
                return res.status(400).json({
                    message:
                        'Branch code already exists in this department',
                })
            }
        }

        await branch.update({
            branchName: branchName ?? branch.branchName,
            branchCode: newBranchCode,
            departmentId: newDepartmentId,
            activeFlag: activeFlag ?? branch.activeFlag,
            updatedBy: userId ?? null,
            updatedOn: new Date(),
        })

        return res.status(200).json({
            message: 'Branch updated successfully',
            data: branch,
        })
    } catch (error: any) {
        console.error('updateBranch error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const getBranches = async (req: AuthRequest, res: Response) => {
    try {
        const branches = await Branch.findAll({
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'departmentName', 'departmentCode'],
                },
            ],
            order: [['branchName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Branches fetched successfully',
            data: branches,
        })
    } catch (error: any) {
        console.error('getBranches error:', error)

        return res.status(500).json({
            message: 'Failed to fetch branches',
            error: error?.message || error,
        })
    }
}

export const getBranchById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params

        const branch = await Branch.findByPk(id, {
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'departmentName', 'departmentCode'],
                },
            ],
        })

        if (!branch) {
            return res.status(404).json({
                message: 'Branch not found',
            })
        }

        return res.status(200).json({
            message: 'Branch fetched successfully',
            data: branch,
        })
    } catch (error: any) {
        console.error('getBranchById error:', error)

        return res.status(500).json({
            message: 'Failed to fetch branch',
            error: error?.message || error,
        })
    }
}

export const getBranchesByDepartmentId = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { departmentId } = req.params

        // Check whether the department exists
        const department = await Department.findByPk(departmentId)

        if (!department) {
            return res.status(404).json({
                message: 'Department not found',
            })
        }

        const branches = await Branch.findAll({
            where: {
                departmentId,
            },
            order: [['branchName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Branches fetched successfully',
            data: branches,
        })
    } catch (error: any) {
        console.error('getBranchesByDepartmentId error:', error)

        return res.status(500).json({
            message: 'Failed to fetch branches',
            error: error?.message || error,
        })
    }
}
