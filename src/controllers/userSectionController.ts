
import { Response } from 'express'
import { UserSection } from '../models/userSection.model'
import { User } from '../models/user.model'
import { Section } from '../models/section.model'
import { AuthRequest } from '../types/auth.types'
import { Op, Transaction  } from 'sequelize'
import {
    sequelize,
    Audit,
} from '../models';
import { EntityType } from '../models/enums';

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
    let transaction: Transaction | undefined;

    try {
        const { mappings } = req.body;
        const createdBy = req.user?.id;

        if (!createdBy) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        // Validate request array
        if (!Array.isArray(mappings) || mappings.length === 0) {
            return res.status(400).json({
                message: 'Mappings must be a non-empty array',
            });
        }

        // Validate each mapping object
        for (const mapping of mappings) {
            if (!mapping.userId || !mapping.sectionId) {
                return res.status(400).json({
                    message: 'Each mapping must contain userId and sectionId',
                });
            }
        }

        // Reject duplicate pairs within the request
        const requestPairs = new Set<string>();

        for (const mapping of mappings) {
            const key = `${mapping.userId}:${mapping.sectionId}`;

            if (requestPairs.has(key)) {
                return res.status(400).json({
                    message: 'Duplicate userId and sectionId pair in request',
                    data: mapping,
                });
            }

            requestPairs.add(key);
        }

        // Validate referenced users
        const userIds = [
            ...new Set(mappings.map((mapping: any) => mapping.userId)),
        ];

        const users = await User.findAll({
            where: { id: { [Op.in]: userIds } },
            attributes: ['id'],
        });

        const existingUserIds = new Set(users.map((user) => user.id));
        const invalidUserIds = userIds.filter(
            (id: string) => !existingUserIds.has(id)
        );

        if (invalidUserIds.length > 0) {
            return res.status(404).json({
                message: 'Some users were not found',
                invalidUserIds,
            });
        }

        // Validate referenced sections
        const sectionIds = [
            ...new Set(mappings.map((mapping: any) => mapping.sectionId)),
        ];

        const sections = await Section.findAll({
            where: { id: { [Op.in]: sectionIds } },
            attributes: ['id'],
        });

        const existingSectionIds = new Set(
            sections.map((section) => section.id)
        );

        const invalidSectionIds = sectionIds.filter(
            (id: string) => !existingSectionIds.has(id)
        );

        if (invalidSectionIds.length > 0) {
            return res.status(404).json({
                message: 'Some sections were not found',
                invalidSectionIds,
            });
        }

        // Check for existing mappings
        const existingMappings = await UserSection.findAll({
            where: {
                [Op.or]: mappings.map((mapping: any) => ({
                    userId: mapping.userId,
                    sectionId: mapping.sectionId,
                })),
            },
            attributes: ['userId', 'sectionId'],
        });

        if (existingMappings.length > 0) {
            return res.status(400).json({
                message: 'Some user-section mappings already exist',
                existingMappings: existingMappings.map((item) => ({
                    userId: item.userId,
                    sectionId: item.sectionId,
                })),
            });
        }

        // Start transaction
        transaction = await sequelize.transaction();

        // Create all mappings
        const createdMappings = await UserSection.bulkCreate(
            mappings.map((mapping: any) => ({
                userId: mapping.userId,
                sectionId: mapping.sectionId,
                createdBy,
                createdOn: new Date(),
            })),
            {
                validate: true,
                transaction,
            }
        );

        // Create an audit record for every mapping
        for (const mapping of createdMappings) {
            await Audit.create(
                {
                    entity: EntityType.USER_SECTION,
                    entityId: mapping.id,
                    action: 'Create',
                    performedBy: createdBy,
                    remarks: `User-section mapping created. User ID: ${mapping.userId}, Section ID: ${mapping.sectionId}`,
                    ipAddress:
                        req.ip || req.socket.remoteAddress || 'unknown',
                    timestamp: new Date(),
                },
                { transaction }
            );
        }

        await transaction.commit();

        return res.status(201).json({
            message: 'User-section mappings created successfully',
            count: createdMappings.length,
            data: createdMappings,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    'Transaction rollback error:',
                    rollbackError
                );
            }
        }

        console.error('createUserSection error:', error);

        return res.status(500).json({
            message: 'Failed to create user-section mappings',
            error: error.message,
        });
    }
};

export const updateUserSection = async (
    req: AuthRequest,
    res: Response
) => {
    let transaction: Transaction | undefined;

    try {
        const { id, userId, sectionId } = req.body;
        const performedBy = req.user?.id;

        if (!performedBy) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!id) {
            return res.status(400).json({
                message: 'Mapping ID is required',
            });
        }

        transaction = await sequelize.transaction();

        const mapping = await UserSection.findByPk(id, {
            transaction,
        });

        if (!mapping) {
            await transaction.rollback();
            transaction = undefined;

            return res.status(404).json({
                message: 'User-section mapping not found',
            });
        }

        // Capture previous values before updating
        const previousValues = {
            userId: mapping.userId,
            sectionId: mapping.sectionId,
        };

        const newUserId = userId ?? mapping.userId;
        const newSectionId = sectionId ?? mapping.sectionId;

        // Validate user if changed
        if (userId && userId !== mapping.userId) {
            const user = await User.findByPk(userId, { transaction });

            if (!user) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(404).json({
                    message: 'User not found',
                });
            }
        }

        // Validate section if changed
        if (sectionId && sectionId !== mapping.sectionId) {
            const section = await Section.findByPk(sectionId, {
                transaction,
            });

            if (!section) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(404).json({
                    message: 'Section not found',
                });
            }
        }

        // Check for duplicate user-section pair
        if (
            newUserId !== mapping.userId ||
            newSectionId !== mapping.sectionId
        ) {
            const existingMapping = await UserSection.findOne({
                where: {
                    userId: newUserId,
                    sectionId: newSectionId,
                    id: { [Op.ne]: id },
                },
                transaction,
            });

            if (existingMapping) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'This section is already assigned to the user',
                });
            }
        }

        // Update mapping
        await mapping.update(
            {
                userId: newUserId,
                sectionId: newSectionId,
            },
            { transaction }
        );

        // Create audit record
        await Audit.create(
            {
                entity: EntityType.USER_SECTION,
                entityId: mapping.id,
                action: 'Update',
                performedBy,
                remarks: `User-section mapping updated. Previous values: ${JSON.stringify(
                    previousValues
                )}. New values: ${JSON.stringify({
                    userId: newUserId,
                    sectionId: newSectionId,
                })}`,
                ipAddress:
                    req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );
   
        await transaction.commit();

        return res.status(200).json({
            message: 'User-section mapping updated successfully',
            data: mapping,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    'Transaction rollback error:',
                    rollbackError
                );
            }
        }

        console.error('updateUserSection error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};


export const getUserSections = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const {
            page = '1',
            limit = '10',
            name,
            username,
            sectionName,
        } = req.body;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                message: 'Page must be positive and limit must be between 1 and 100.',
            });
        }

        const userWhere: any = {};
        const sectionWhere: any = {};

        if (typeof name === 'string' && name.trim()) {
            userWhere.name = {
                [Op.iLike]: `%${name.trim()}%`,
            };
        }

        if (typeof username === 'string' && username.trim()) {
            userWhere.username = {
                [Op.iLike]: `%${username.trim()}%`,
            };
        }

        if (typeof sectionName === 'string' && sectionName.trim()) {
            sectionWhere.sectionName = {
                [Op.iLike]: `%${sectionName.trim()}%`,
            };
        }

        const { count, rows } = await UserSection.findAndCountAll({
            where: {},
            include: [
                {
                    model: User,
                    as: 'user',
                    where: Object.keys(userWhere).length
                        ? userWhere
                        : undefined,
                    required: Object.keys(userWhere).length > 0,
                },
                {
                    model: Section,
                    as: 'section',
                    where: Object.keys(sectionWhere).length
                        ? sectionWhere
                        : undefined,
                    required: Object.keys(sectionWhere).length > 0,
                },
            ],
            order: [['createdOn', 'DESC']],
            limit: pageSize,
            offset: (pageNumber - 1) * pageSize,
            distinct: true,
        });

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            message: 'User-section mappings fetched successfully',
            pagination: {
                totalRecords: count,
                totalPages,
                currentPage: pageNumber,
                pageSize,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1,
            },
            data: rows,
        });
    } catch (error: any) {
        console.error('getUserSections error:', error);

        return res.status(500).json({
            message: 'Failed to fetch user-section mappings',
            error: error?.message || error,
        });
    }
};

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
        const { userId } = req.params;
        const {
            page = '1',
            limit = '10',
            sectionName,
        } = req.body;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                message: 'Page must be positive and limit must be between 1 and 100.',
            });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        const sectionWhere: any = {};

        if (typeof sectionName === 'string' && sectionName.trim()) {
            sectionWhere.sectionName = {
                [Op.iLike]: `%${sectionName.trim()}%`,
            };
        }

        const { count, rows } = await UserSection.findAndCountAll({
            where: { userId },
            include: [
                {
                    model: Section,
                    as: 'section',
                    where: Object.keys(sectionWhere).length
                        ? sectionWhere
                        : undefined,
                    required: Object.keys(sectionWhere).length > 0,
                },
            ],
            order: [['createdOn', 'DESC']],
            limit: pageSize,
            offset: (pageNumber - 1) * pageSize,
            distinct: true,
        });

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            message: 'User sections fetched successfully',
            pagination: {
                totalRecords: count,
                totalPages,
                currentPage: pageNumber,
                pageSize,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1,
            },
            data: rows,
        });
    } catch (error: any) {
        console.error('getUserSectionsByUserId error:', error);

        return res.status(500).json({
            message: 'Failed to fetch sections for user',
            error: error?.message || error,
        });
    }
};
