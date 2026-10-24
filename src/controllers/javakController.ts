import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types/auth.types'

import { Javak } from '../models/javak.model';
import { Avak } from '../models/avak.model';
import { Sender } from '../models/sender.model';
import { Branch } from '../models/branch.model';
import { Section } from '../models/section.model';

//const JAVAK_STATUSES = [
//     'Draft',
//     'Pending Dispatch',
//     'Dispatched',
//     'Delivered',
//     'Returned',
//     'Cancelled',
// ];

// const DISPATCH_MODES = [
//     'Speed Post',
//     'Registered Post (AD)',
//     'Courier',
//     'Hand Delivery',
//     'Email',
//     'WhatsApp / SMS',
//     'Fax',
// ];

/**
 * Common associations:
 * Javak -> Avak -> Sender, Branch, Marked Section
 */
const javakIncludes = [
    {
        model: Avak,
        as: 'avak',
        required: false,
        include: [
            {
                model: Sender,
                as: 'sender',
                attributes: [
                    'id',
                    'senderName',
                    'senderType',
                    'organization',
                    'designation',
                    'address',
                    'district',
                    'taluka',
                    'pinCode',
                    'mobile',
                    'email',
                    'activeFlag',
                ],
                required: false,
            },
            {
                model: Branch,
                as: 'branch',
                attributes: ['id', 'branchName', 'branchCode'],
                required: false,
            },
            {
                model: Section,
                as: 'markedSection',
                attributes: ['id', 'sectionName', 'sectionCode'],
                required: false,
            },
        ],
    },
];

/**
 * GET JAVAK BY ID
 * Fetches Javak with its associated Avak, sender, branch and section.
 */
export const getJavakById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'JAVAK ID is required.',
            });
        }

        const javak = await Javak.findByPk(id, {
            include: javakIncludes,
        });

        if (!javak) {
            return res.status(404).json({
                message: 'JAVAK not found.',
            });
        }

        return res.status(200).json({
            message: `JAVAK fetched successfully. JAVAK Number: ${javak.javakNumber}`,
            data: javak,
        });
    } catch (error: any) {
        console.error('getJavakById error:', error);

        return res.status(500).json({
            message: 'Failed to fetch JAVAK.',
            error: error.message,
        });
    }
};

/**
 * GET ALL JAVAK
 * Supports pagination and optional status/dispatch-mode filters.
 */
export const getAllJavak = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const page = Math.max(
            1,
            parseInt(String(req.body.page || '1'), 10) || 1
        );

        const pageSize = Math.min(
            100,
            Math.max(
                1,
                parseInt(String(req.body.limit || '10'), 10) || 10
            )
        );

        const offset = (page - 1) * pageSize;

        const { status, dispatchMode, javakNumber, avakId } = req.body;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (dispatchMode) {
            where.dispatchMode = dispatchMode;
        }

        if (javakNumber) {
            where.javakNumber = {
                [Op.iLike]: `%${String(javakNumber).trim()}%`,
            };
        }

        if (avakId) {
            where.avakId = avakId;
        }

        const { count, rows } = await Javak.findAndCountAll({
            where,
            include: javakIncludes,
            distinct: true,
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']],
        });

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            message: 'JAVAK records fetched successfully.',
            data: rows,
            pagination: {
                totalRecords: count,
                totalPages,
                currentPage: page,
                pageSize,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error: any) {
        console.error('getAllJavak error:', error);

        return res.status(500).json({
            message: 'Failed to fetch JAVAK records.',
            error: error.message,
        });
    }
};

/**
 * UPDATE JAVAK
 * Supports partial updates.
 */
export const updateJavak = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                message: 'JAVAK ID is required.',
            });
        }

        const javak = await Javak.findByPk(id);

        if (!javak) {
            return res.status(404).json({
                message: 'JAVAK not found.',
            });
        }

        const {
            isDocumentReceived,
            receivedDocumentDate,
            actionRemarks,
            status,
            dispatchMode,
        } = req.body;

        const updates: Record<string, any> = {};

        // Validate and update document receipt flag.
        if (isDocumentReceived !== undefined) {
            if (typeof isDocumentReceived !== 'boolean') {
                return res.status(400).json({
                    message: 'isDocumentReceived must be a boolean.',
                });
            }

            updates.isDocumentReceived = isDocumentReceived;
        }

        // Validate and update receipt date.
        if (receivedDocumentDate !== undefined) {
            if (
                receivedDocumentDate !== null &&
                (
                    typeof receivedDocumentDate !== 'string' ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(receivedDocumentDate) ||
                    Number.isNaN(Date.parse(receivedDocumentDate))
                )
            ) {
                return res.status(400).json({
                    message: 'receivedDocumentDate must be a valid date in YYYY-MM-DD format or null.',
                });
            }

            updates.receivedDocumentDate = receivedDocumentDate;
        }

        // Validate and update remarks.
        if (actionRemarks !== undefined) {
            if (
                actionRemarks !== null &&
                typeof actionRemarks !== 'string'
            ) {
                return res.status(400).json({
                    message: 'actionRemarks must be a string or null.',
                });
            }

            updates.actionRemarks =
                typeof actionRemarks === 'string'
                    ? actionRemarks.trim()
                    : null;
        }

        // Validate and update status.
        if (status !== undefined) {
            if (
                typeof status !== 'string' 
            ) {
                return res.status(400).json({
                    message: 'Invalid status.',            
                });
            }

            updates.status = status;
        }

        // Validate and update dispatch mode.
        if (dispatchMode !== undefined) {
            if (
                dispatchMode !== null &&
                (
                    typeof dispatchMode !== 'string'
                    
                )
            ) {
                return res.status(400).json({
                    message: 'Invalid dispatchMode.',
                   
                });
            }

            updates.dispatchMode = dispatchMode;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: 'No valid fields provided for update.',
            });
        }

        // Record the authenticated user who updated the entry.
        const userId = req.user?.id;

        if (userId) {
            updates.updatedBy = userId;
        }

        await javak.update(updates);

        // Fetch the updated record with all associated details.
        const updatedJavak = await Javak.findByPk(id, {
            include: javakIncludes,
        });

        return res.status(200).json({
            message: `JAVAK updated successfully. JAVAK Number: ${javak.javakNumber}`,
            data: updatedJavak,
        });
    } catch (error: any) {
        console.error('updateJavak error:', error);

        return res.status(500).json({
            message: 'Failed to update JAVAK.',
            error: error.message,
        });
    }
};