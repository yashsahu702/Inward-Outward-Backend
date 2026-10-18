
import { Response } from 'express'
import { Section } from '../models/section.model'
import { AuthRequest } from '../types/auth.types'

export const createSection = async (req: AuthRequest, res: Response) => {
    try {
        const { sectionName, sectionCode, activeFlag } = req.body
        const userId = req.user?.id

        if (!sectionName || !sectionCode) {
            return res.status(400).json({
                message: 'Section name and section code are required',
            })
        }

        // Check duplicate section code
        const existingSection = await Section.findOne({
            where: { sectionCode },
        })

        if (existingSection) {
            return res.status(400).json({
                message: 'Section code already exists',
            })
        }

        const section = await Section.create({
            sectionName,
            sectionCode,
            activeFlag: activeFlag ?? true,
            createdBy: userId ?? null,
            createdOn: new Date(),
        })

        return res.status(201).json({
            message: 'Section created successfully',
            data: section,
        })
    } catch (error: any) {
        console.error('createSection error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const updateSection = async (req: AuthRequest, res: Response) => {
    try {
        const { id, sectionName, sectionCode, activeFlag } = req.body
        const userId = req.user?.id

        if (!id) {
            return res.status(400).json({
                message: 'Section ID is required',
            })
        }

        const section = await Section.findByPk(id)

        if (!section) {
            return res.status(404).json({
                message: 'Section not found',
            })
        }

        // Check duplicate section code if it is being changed
        if (sectionCode && sectionCode !== section.sectionCode) {
            const existingSection = await Section.findOne({
                where: { sectionCode },
            })

            if (existingSection) {
                return res.status(400).json({
                    message: 'Section code already exists',
                })
            }
        }

        await section.update({
            sectionName: sectionName ?? section.sectionName,
            sectionCode: sectionCode ?? section.sectionCode,
            activeFlag: activeFlag ?? section.activeFlag,
            updatedBy: userId ?? null,
            updatedOn: new Date(),
        })

        return res.status(200).json({
            message: 'Section updated successfully',
            data: section,
        })
    } catch (error: any) {
        console.error('updateSection error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const getSections = async (req: AuthRequest, res: Response) => {
    try {
        const sections = await Section.findAll({
            order: [['sectionName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Sections fetched successfully',
            data: sections,
        })
    } catch (error: any) {
        console.error('getSections error:', error)

        return res.status(500).json({
            message: 'Failed to fetch sections',
            error: error?.message || error,
        })
    }
}

export const getSectionById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params

        const section = await Section.findByPk(id)

        if (!section) {
            return res.status(404).json({
                message: 'Section not found',
            })
        }

        return res.status(200).json({
            message: 'Section fetched successfully',
            data: section,
        })
    } catch (error: any) {
        console.error('getSectionById error:', error)

        return res.status(500).json({
            message: 'Failed to fetch section',
            error: error?.message || error,
        })
    }
}
