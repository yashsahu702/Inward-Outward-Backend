
import { Response } from 'express'
import { Subject } from '../models/subject.model'
import { Department } from '../models/department.model'
import { AuthRequest } from '../types/auth.types'

export const createSubject = async (req: AuthRequest, res: Response) => {
    try {
        const {
            subjectName,
            subjectCode,
            departmentId,
            activeFlag,
        } = req.body

        const userId = req.user?.id

        if (!subjectName || !departmentId) {
            return res.status(400).json({
                message: 'Subject name and department ID are required',
            })
        }

        // Check whether the department exists
        const department = await Department.findByPk(departmentId)

        if (!department) {
            return res.status(404).json({
                message: 'Department not found',
            })
        }

        // Check duplicate subject code, if provided
        if (subjectCode) {
            const existingSubject = await Subject.findOne({
                where: { subjectCode },
            })

            if (existingSubject) {
                return res.status(400).json({
                    message: 'Subject code already exists',
                })
            }
        }

        const subject = await Subject.create({
            subjectName,
            subjectCode: subjectCode || null,
            departmentId,
            activeFlag: activeFlag ?? true,
            createdBy: userId ?? null,
            createdOn: new Date(),
        })

        return res.status(201).json({
            message: 'Subject created successfully',
            data: subject,
        })
    } catch (error: any) {
        console.error('createSubject error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const updateSubject = async (req: AuthRequest, res: Response) => {
    try {
        const { id, subjectName, subjectCode, departmentId, activeFlag } =
            req.body

        const userId = req.user?.id

        if (!id) {
            return res.status(400).json({
                message: 'Subject ID is required',
            })
        }

        const subject = await Subject.findByPk(id)

        if (!subject) {
            return res.status(404).json({
                message: 'Subject not found',
            })
        }

        // Check duplicate subject code when changing it
        if (
            subjectCode &&
            subjectCode !== subject.subjectCode
        ) {
            const existingSubject = await Subject.findOne({
                where: { subjectCode },
            })

            if (existingSubject) {
                return res.status(400).json({
                    message: 'Subject code already exists',
                })
            }
        }

        // Validate department if it is being changed
        if (departmentId && departmentId !== subject.departmentId) {
            const department = await Department.findByPk(departmentId)

            if (!department) {
                return res.status(404).json({
                    message: 'Department not found',
                })
            }
        }

        await subject.update({
            subjectName: subjectName ?? subject.subjectName,
            subjectCode:
                subjectCode === undefined
                    ? subject.subjectCode
                    : subjectCode || null,
            departmentId: departmentId ?? subject.departmentId,
            activeFlag: activeFlag ?? subject.activeFlag,
            updatedBy: userId ?? null,
            updatedOn: new Date(),
        })

        return res.status(200).json({
            message: 'Subject updated successfully',
            data: subject,
        })
    } catch (error: any) {
        console.error('updateSubject error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const getSubjects = async (req: AuthRequest, res: Response) => {
    try {
        const subjects = await Subject.findAll({
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'departmentName', 'departmentCode'],
                },
            ],
            order: [['subjectName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Subjects fetched successfully',
            data: subjects,
        })
    } catch (error: any) {
        console.error('getSubjects error:', error)

        return res.status(500).json({
            message: 'Failed to fetch subjects',
            error: error?.message || error,
        })
    }
}

export const getSubjectById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params

        const subject = await Subject.findByPk(id, {
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'departmentName', 'departmentCode'],
                },
            ],
        })

        if (!subject) {
            return res.status(404).json({
                message: 'Subject not found',
            })
        }

        return res.status(200).json({
            message: 'Subject fetched successfully',
            data: subject,
        })
    } catch (error: any) {
        console.error('getSubjectById error:', error)

        return res.status(500).json({
            message: 'Failed to fetch subject',
            error: error?.message || error,
        })
    }
}


export const getSubjectsByDepartmentId = async (
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

        const subjects = await Subject.findAll({
            where: {
                departmentId,
            },
            order: [['subjectName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Subjects fetched successfully',
            data: subjects,
        })
    } catch (error: any) {
        console.error('getSubjectsByDepartmentId error:', error)

        return res.status(500).json({
            message: 'Failed to fetch subjects',
            error: error?.message || error,
        })
    }
}
