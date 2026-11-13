
import { Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Audit } from '../models/audit.model';
import { User } from '../models/user.model';
import { AuthRequest } from '../types/types';

// ==========================================
// GET ALL AUDITS (WITH PAGINATION & FILTERS)
// ==========================================

export const getAllAudits = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 10,
            entity,
            entityId,
            action,
            userId,
            fromDate,
            toDate,
            search
        } = req.body;

        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.max(1, Math.min(100, Number(limit) || 10));
        const offset = (pageNumber - 1) * pageSize;

        const where: WhereOptions = {};

        // Entity filter
        if (entity) {
            where['entity'] = entity;
        }

        // Entity ID filter
        if (entityId) {
            where['entityId'] = entityId;
        }

        // Action filter
        if (action) {
            where['action'] = {
                [Op.iLike]: `%${action}%`
            };
        }

        // User ID filter
        if (userId) {
            where['userId'] = userId;
        }

        // Date filters
        if (fromDate || toDate) {
            const timestampFilter: any = {};

            if (fromDate) {
                const startDate = new Date(fromDate);

                if (isNaN(startDate.getTime())) {
                    res.status(400).json({
                        message: 'Invalid fromDate format.'
                    });
                    return;
                }

                timestampFilter[Op.gte] = startDate;
            }

            if (toDate) {
                const endDate = new Date(toDate);

                if (isNaN(endDate.getTime())) {
                    res.status(400).json({
                        message: 'Invalid toDate format.'
                    });
                    return;
                }

                endDate.setHours(23, 59, 59, 999);
                timestampFilter[Op.lte] = endDate;
            }

            where['timestamp'] = timestampFilter;
        }

        // User association
        const include: any[] = [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email'],
                required: !!search,
                ...(search
                    ? {
                        where: {
                            [Op.or]: [
                                {
                                    name: {
                                        [Op.iLike]: `%${search}%`
                                    }
                                },
                                {
                                    email: {
                                        [Op.iLike]: `%${search}%`
                                    }
                                }
                            ]
                        }
                    }
                    : {})
            }
        ];

        // Fetch audits
        const { count, rows } = await Audit.findAndCountAll({
            where,
            include,
            order: [['timestamp', 'DESC']],
            limit: pageSize,
            offset,
            distinct: true
        });

        res.status(200).json({
            message: 'Audit records fetched successfully.',
            data: rows,
            pagination: {
                totalRecords: count,
                totalPages: Math.ceil(count / pageSize),
                currentPage: pageNumber,
                limit: pageSize
            }
        });

    } catch (error: any) {
        console.error('Get All Audits Error:', error);

        res.status(500).json({
            message: 'Failed to fetch audit records.',
            error: error.message
        });
    }
};


// ==========================================
// GET AUDIT BY ID
// ==========================================

export const getAuditById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const audit = await Audit.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        if (!audit) {
            res.status(404).json({
                message: 'Audit record not found.'
            });
            return;
        }

        res.status(200).json({
            message: 'Audit record fetched successfully.',
            data: audit
        });

    } catch (error: any) {
        console.error('Get Audit By ID Error:', error);

        res.status(500).json({
            message: 'Failed to fetch audit record.',
            error: error.message
        });
    }
};
