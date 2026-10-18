
import { Response } from 'express'
import { UserSection } from '../models/userSection.model'
import { User } from '../models/user.model'
import { Section } from '../models/section.model'
import { AuthRequest } from '../types/auth.types'
import { Op } from 'sequelize'

// export const createUserSection = async (
//     req: AuthRequest,
//     res: Response
// ) => {
//     try {
//         const { userId, sectionId } = req.body
//         const createdBy = req.user?.id

//         if (!userId || !sectionId) {
//             return res.status(400).json({
//                 message: 'User ID and section ID are required',
//             })
//         }

//         // Validate user
//         const user = await User.findByPk(userId)

//         if (!user) {
//             return res.status(404).json({
//                 message: 'User not found',
//             })
//         }

//         // Validate section
//         const section = await Section.findByPk(sectionId)

//         if (!section) {
//             return res.status(404).json({
//                 message: 'Section not found',
//             })
//         }

//         // Check whether mapping already exists
//         const existingMapping = await UserSection.findOne({
//             where: { userId, sectionId },
//         })

//         if (existingMapping) {
//             return res.status(400).json({
//                 message: 'This section is already assigned to the user',
//             })
//         }

//         const mapping = await UserSection.create({
//             userId,
//             sectionId,
//             createdBy: createdBy ?? null,
//             createdOn: new Date(),
//         })

//         return res.status(201).json({
//             message: 'User-section mapping created successfully',
//             data: mapping,
//         })
//     } catch (error: any) {
//         console.error('createUserSection error:', error)

//         return res.status(500).json({
//             message: 'Internal server error',
//             error: error.message,
//         })
//     }
// }

export const createUserSection = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { mappings } = req.body
        const createdBy = req.user?.id

        // Validate request array
        if (!Array.isArray(mappings) || mappings.length === 0) {
            return res.status(400).json({
                message: 'Mappings must be a non-empty array',
            })
        }

        // Validate each mapping object
        for (const mapping of mappings) {
            if (!mapping.userId || !mapping.sectionId) {
                return res.status(400).json({
                    message: 'Each mapping must contain userId and sectionId',
                })
            }
        }

        // Reject duplicate pairs within the request itself
        const requestPairs = new Set<string>()

        for (const mapping of mappings) {
            const key = `${mapping.userId}:${mapping.sectionId}`

            if (requestPairs.has(key)) {
                return res.status(400).json({
                    message: 'Duplicate userId and sectionId pair in request',
                    data: mapping,
                })
            }

            requestPairs.add(key)
        }

        // Validate that all referenced users exist
        const userIds = [...new Set(mappings.map((m: any) => m.userId))]
        const users = await User.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ['id'],
        })

        const existingUserIds = new Set(users.map((user) => user.id))
        const invalidUserIds = userIds.filter(
            (id: string) => !existingUserIds.has(id)
        )

        if (invalidUserIds.length > 0) {
            return res.status(404).json({
                message: 'Some users were not found',
                invalidUserIds,
            })
        }

        // Validate that all referenced sections exist
        const sectionIds = [
            ...new Set(mappings.map((m: any) => m.sectionId)),
        ]

        const sections = await Section.findAll({
            where: { id: { [Op.in]: sectionIds } },
            attributes: ['id'],
        })

        const existingSectionIds = new Set(
            sections.map((section) => section.id)
        )

        const invalidSectionIds = sectionIds.filter(
            (id: string) => !existingSectionIds.has(id)
        )

        if (invalidSectionIds.length > 0) {
            return res.status(404).json({
                message: 'Some sections were not found',
                invalidSectionIds,
            })
        }

        // Check whether any mappings already exist
        const existingMappings = await UserSection.findAll({
            where: {
                [Op.or]: mappings.map((mapping: any) => ({
                    userId: mapping.userId,
                    sectionId: mapping.sectionId,
                })),
            },
            attributes: ['userId', 'sectionId'],
        })

        if (existingMappings.length > 0) {
            return res.status(400).json({
                message: 'Some user-section mappings already exist',
                existingMappings: existingMappings.map((item) => ({
                    userId: item.userId,
                    sectionId: item.sectionId,
                })),
            })
        }

        // Insert all mappings
        const createdMappings = await UserSection.bulkCreate(
            mappings.map((mapping: any) => ({
                userId: mapping.userId,
                sectionId: mapping.sectionId,
                createdBy: createdBy ?? null,
                createdOn: new Date(),
            })),
            {
                validate: true,
            }
        )

        return res.status(201).json({
            message: 'User-section mappings created successfully',
            count: createdMappings.length,
            data: createdMappings,
        })
    } catch (error: any) {
        console.error('createUserSection error:', error)

        return res.status(500).json({
            message: 'Failed to create user-section mappings',
            error: error.message,
        })
    }
}


export const updateUserSection = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id, userId, sectionId } = req.body

        if (!id) {
            return res.status(400).json({
                message: 'Mapping ID is required',
            })
        }

        const mapping = await UserSection.findByPk(id)

        if (!mapping) {
            return res.status(404).json({
                message: 'User-section mapping not found',
            })
        }

        const newUserId = userId ?? mapping.userId
        const newSectionId = sectionId ?? mapping.sectionId

        // Validate user if changed
        if (userId && userId !== mapping.userId) {
            const user = await User.findByPk(userId)

            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                })
            }
        }

        // Validate section if changed
        if (sectionId && sectionId !== mapping.sectionId) {
            const section = await Section.findByPk(sectionId)

            if (!section) {
                return res.status(404).json({
                    message: 'Section not found',
                })
            }
        }

        // Check duplicate user-section pair
        if (
            newUserId !== mapping.userId ||
            newSectionId !== mapping.sectionId
        ) {
            const existingMapping = await UserSection.findOne({
                where: {
                    userId: newUserId,
                    sectionId: newSectionId,
                },
            })

            if (existingMapping && existingMapping.id !== mapping.id) {
                return res.status(400).json({
                    message: 'This section is already assigned to the user',
                })
            }
        }

        await mapping.update({
            userId: newUserId,
            sectionId: newSectionId,
        })

        return res.status(200).json({
            message: 'User-section mapping updated successfully',
            data: mapping,
        })
    } catch (error: any) {
        console.error('updateUserSection error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const getUserSections = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const mappings = await UserSection.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                },
                {
                    model: Section,
                    as: 'section',
                },
            ],
            order: [['createdOn', 'DESC']],
        })

        return res.status(200).json({
            message: 'User-section mappings fetched successfully',
            data: mappings,
        })
    } catch (error: any) {
        console.error('getUserSections error:', error)

        return res.status(500).json({
            message: 'Failed to fetch user-section mappings',
            error: error?.message || error,
        })
    }
}

export const getUserSectionById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params

        const mapping = await UserSection.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                },
                {
                    model: Section,
                    as: 'section',
                },
            ],
        })

        if (!mapping) {
            return res.status(404).json({
                message: 'User-section mapping not found',
            })
        }

        return res.status(200).json({
            message: 'User-section mapping fetched successfully',
            data: mapping,
        })
    } catch (error: any) {
        console.error('getUserSectionById error:', error)

        return res.status(500).json({
            message: 'Failed to fetch user-section mapping',
            error: error?.message || error,
        })
    }
}

export const getUserSectionsByUserId = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { userId } = req.params

        const user = await User.findByPk(userId)

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            })
        }

        const mappings = await UserSection.findAll({
            where: { userId },
            include: [
                {
                    model: Section,
                    as: 'section',
                },
            ],
            order: [['createdOn', 'DESC']],
        })

        return res.status(200).json({
            message: 'User sections fetched successfully',
            data: mappings,
        })
    } catch (error: any) {
        console.error('getUserSectionsByUserId error:', error)

        return res.status(500).json({
            message: 'Failed to fetch sections for user',
            error: error?.message || error,
        })
    }
}
