import { Request, Response } from 'express'
import { Department } from '../models/department.model'
import { AuthRequest } from '../types/auth.types'


export const createDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const { departmentName, departmentCode, activeFlag } = req.body
        const userId = req.user?.id

        if (!departmentName || !departmentCode) {
            return res.status(400).json({
                message: 'Department name and department code are required',
            })
        }

        // 🔍 Check duplicate department code
        const existingDepartment = await Department.findOne({
            where: { departmentCode },
        })

        if (existingDepartment) {
            return res.status(400).json({
                message: 'Department code already exists',
            })
        }

        const department = await Department.create({

            departmentName,
            departmentCode,
            activeFlag: activeFlag ?? true,
            createdBy: userId,
            createdOn: new Date(),
        })

        return res.status(201).json({
            message: 'Department created successfully',
            data: department,
        })
    } catch (error: any) {
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const updateDepartment = async (req: AuthRequest, res: Response) => {
    try {

        const { id, departmentName, departmentCode, activeFlag } = req.body
        const userId = req.user?.id

        const department = await Department.findByPk(id)

        if (!department) {
            return res.status(404).json({
                message: 'Department not found',
            })
        }

        // 🔍 Check duplicate department code (if updating code)
        if (departmentCode && departmentCode !== department.departmentCode) {
            const existingDepartment = await Department.findOne({
                where: { departmentCode },
            })

            if (existingDepartment) {
                return res.status(400).json({
                    message: 'Department code already exists',
                })
            }
        }

        await department.update({
            departmentName: departmentName ?? department.departmentName,
            departmentCode: departmentCode ?? department.departmentCode,
            activeFlag: activeFlag ?? department.activeFlag,
            updatedBy: userId,
            updatedOn: new Date(),
        })

        return res.status(200).json({
            message: 'Department updated successfully',
            data: department,
        })
    } catch (error: any) {
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}


export const getDepartments = async (req: AuthRequest, res: Response) => {
    try {


        const departments = await Department.findAll({

            order: [['departmentName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Departments fetched successfully',
            data: departments,
        })
    } catch (error: any) {
        console.error('getDepartments error:', error)
        return res.status(500).json({
            message: 'Failed to fetch departments',
            error: error?.message || error,
        })
    }
}


export const getDepartmentById = async (req: AuthRequest, res: Response) => {
    try {

        const { id } = req.params;
        const department = await Department.findOne({
            where: { id: id },

        })

        return res.status(200).json({
            message: 'Department fetched successfully',
            data: department,
        })
    } catch (error: any) {
        console.error('getDepartments error:', error)
        return res.status(500).json({
            message: 'Failed to fetch departments',
            error: error?.message || error,
        })
    }
}


