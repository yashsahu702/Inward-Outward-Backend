
import { Response } from 'express'
import { Section } from '../models/section.model'
import { AuthRequest } from '../types/auth.types'
import { sequelize, Audit } from '../models';
import { EntityType } from '../models/enums';
import { Transaction, Op } from 'sequelize';

export const createSection = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const { sectionName, sectionCode, activeFlag } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!sectionName || !sectionCode) {
            return res.status(400).json({
                message: 'Section name and section code are required',
            });
        }

        const existingSection = await Section.findOne({
            where: { sectionCode },
        });

        if (existingSection) {
            return res.status(400).json({
                message: 'Section code already exists',
            });
        }

        transaction = await sequelize.transaction();

        const section = await Section.create(
            {
                sectionName,
                sectionCode,
                activeFlag: activeFlag ?? true,
                createdBy: userId,
                createdOn: new Date(),
            },
            { transaction }
        );

        await Audit.create(
            {
                entity: EntityType.SECTION,
                entityId: section.id,
                action: 'Create',
                performedBy: userId,
                remarks: `Section "${section.sectionName}" created successfully`,
                ipAddress:
                    req.ip ||
                    req.socket.remoteAddress ||
                    'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            message: 'Section created successfully',
            data: section,
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

        console.error('createSection error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export const updateSection = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const { id, sectionName, sectionCode, activeFlag } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!id) {
            return res.status(400).json({
                message: 'Section ID is required',
            });
        }

        const section = await Section.findByPk(id);

        if (!section) {
            return res.status(404).json({
                message: 'Section not found',
            });
        }

        if (
            sectionCode &&
            sectionCode !== section.sectionCode
        ) {
            const existingSection = await Section.findOne({
                where: {
                    sectionCode,
                    id: { [Op.ne]: id },
                },
            });

            if (existingSection) {
                return res.status(400).json({
                    message: 'Section code already exists',
                });
            }
        }

        const previousSection = section.toJSON();

        transaction = await sequelize.transaction();

        await section.update(
            {
                sectionName: sectionName ?? section.sectionName,
                sectionCode: sectionCode ?? section.sectionCode,
                activeFlag: activeFlag ?? section.activeFlag,
                updatedBy: userId,
                updatedOn: new Date(),
            },
            { transaction }
        );

        await Audit.create(
            {
                entity: EntityType.SECTION,
                entityId: section.id,
                action: 'Update',
                performedBy: userId,
                remarks: `Section "${section.sectionName}" updated. Previous values: ${JSON.stringify(previousSection)}`,
                ipAddress:
                    req.ip ||
                    req.socket.remoteAddress ||
                    'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            message: 'Section updated successfully',
            data: section,
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

        console.error('updateSection error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};



export const getSections = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = '1',
            limit = '10',
            sectionName,
            sectionCode,
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

        const where: any = {};

        if (typeof sectionName === 'string' && sectionName.trim()) {
            where.sectionName = {
                [Op.iLike]: `%${sectionName.trim()}%`,
            };
        }

        if (typeof sectionCode === 'string' && sectionCode.trim()) {
            where.sectionCode = {
                [Op.iLike]: `%${sectionCode.trim()}%`,
            };
        }

        const { count, rows } = await Section.findAndCountAll({
            where,
            order: [['sectionName', 'ASC']],
            limit: pageSize,
            offset: (pageNumber - 1) * pageSize,
        });

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            message: 'Sections fetched successfully',
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
        console.error('getSections error:', error);

        return res.status(500).json({
            message: 'Failed to fetch sections',
            error: error?.message || error,
        });
    }
};

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
