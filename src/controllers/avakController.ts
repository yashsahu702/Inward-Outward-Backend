import { Response } from 'express';
import { Transaction } from 'sequelize';

import { Avak } from '../models/avak.model';
import { Sender } from '../models/sender.model';
import { Branch } from '../models/branch.model';
import { Section } from '../models/section.model';
import { AuthRequest } from '../types/auth.types';
import { Audit, sequelize } from '../models';
import { EntityType } from '../models/enums';
import { Op, WhereOptions } from 'sequelize';

export const createAvak = async (
    req: AuthRequest,
    res: Response
) => {
    let transaction: Transaction | undefined;

    try {
        const {
            registrationDate,
            letterReferenceNumber,
            letterDate,
            subject,
            briefDescription,
            correspondenceType,
            priority,
            confidentiality,
            senderId,
            sender,
            receivingMode,
            branchId,
            slaDays,
            markedSectionId,
            status,
        } = req.body;

        const userId = req.user?.id;

        // 1. Validate authenticated user
        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        // 2. Validate required AVAK fields
        if (
            !subject ||
            !correspondenceType ||
            !receivingMode ||
            !markedSectionId
        ) {
            return res.status(400).json({
                message:
                    'Subject, correspondence type, receiving mode and marked section ID are required',
            });
        }

        // 3. Require either an existing senderId or a new sender object
        if (!senderId && !sender) {
            return res.status(400).json({
                message:
                    'Provide an existing senderId or sender details',
            });
        }

        if (senderId && sender) {
            return res.status(400).json({
                message:
                    'Provide either senderId or sender details, not both',
            });
        }

        // 4. A branch can only be selected for an existing sender
        if (branchId && !senderId) {
            return res.status(400).json({
                message:
                    'branchId can only be provided when an existing senderId is selected',
            });
        }

        // 5. Validate new sender details
        if (!senderId) {
            const requiredFields = [
                'senderName',
                'senderType',
                'organization',
                'designation',
                'address',
                'district',
                'taluka',
                'pinCode',
                'mobile',
            ];

            const missingFields = requiredFields.filter(
                (field) =>
                    typeof sender?.[field] !== 'string' ||
                    !sender[field].trim()
            );

            if (missingFields.length > 0) {
                return res.status(400).json({
                    message: 'Required sender fields are missing',
                    missingFields,
                });
            }

            if (!/^\d{6}$/.test(sender.pinCode)) {
                return res.status(400).json({
                    message: 'Pin code must contain exactly 6 digits',
                });
            }

            if (!/^\d{10}$/.test(sender.mobile)) {
                return res.status(400).json({
                    message: 'Mobile number must contain exactly 10 digits',
                });
            }

            if (
                sender.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender.email)
            ) {
                return res.status(400).json({
                    message: 'Invalid sender email address',
                });
            }
        }

        // 6. Validate SLA days
        const resolvedSlaDays = slaDays ?? 7;

        if (
            !Number.isInteger(Number(resolvedSlaDays)) ||
            Number(resolvedSlaDays) < 0
        ) {
            return res.status(400).json({
                message: 'SLA days must be a non-negative integer',
            });
        }

        // 7. Validate marked section
        const section = await Section.findByPk(markedSectionId);

        if (!section) {
            return res.status(404).json({
                message: 'Marked section not found',
            });
        }

        // 8. Validate existing sender and optional branch
        let existingSender: Sender | null = null;

        if (senderId) {
            existingSender = await Sender.findByPk(senderId);

            if (!existingSender) {
                return res.status(404).json({
                    message: 'Sender not found',
                });
            }

            if (!existingSender.activeFlag) {
                return res.status(400).json({
                    message: 'Selected sender is inactive',
                });
            }

            if (branchId) {
                const branch = await Branch.findOne({
                    where: {
                        id: branchId,
                        senderId,
                    },
                });

                if (!branch) {
                    return res.status(400).json({
                        message:
                            'Selected branch does not belong to the selected sender',
                    });
                }
            }
        }

        // 9. Begin transaction
        transaction = await sequelize.transaction();

        let resolvedSenderId: string;
        let resolvedBranchId: string | null = null;
        let senderCreated = false;

        // 10. Use existing sender or create a new citizen sender
        if (existingSender) {
            resolvedSenderId = existingSender.id;

            // Branch is optional for an existing sender
            resolvedBranchId = branchId ?? null;
        } else {
            const newSender = await Sender.create(
                {
                    senderName: sender.senderName.trim(),
                    senderType: sender.senderType.trim(),
                    organization: sender.organization.trim(),
                    designation: sender.designation.trim(),
                    address: sender.address.trim(),
                    district: sender.district.trim(),
                    taluka: sender.taluka.trim(),
                    pinCode: sender.pinCode.trim(),
                    mobile: sender.mobile.trim(),
                    email: sender.email?.trim() || null,
                    activeFlag: true,
                    createdBy: userId,
                    createdOn: new Date(),
                },
                { transaction }
            );

            resolvedSenderId = newSender.id;

            // Citizen sender has no branch
            resolvedBranchId = null;
            senderCreated = true;
        }

        // 11. Create AVAK
        const avak = await Avak.create(
            {
                registrationDate: registrationDate ?? new Date(),
                letterReferenceNumber:
                    letterReferenceNumber?.trim() || null,
                letterDate: letterDate || null,
                subject: subject.trim(),
                briefDescription:
                    briefDescription?.trim() || null,
                correspondenceType,
                priority: priority ?? 'NORMAL',
                confidentiality: confidentiality ?? 'NORMAL',
                senderId: resolvedSenderId,
                receivingMode,
                branchId: resolvedBranchId,
                slaDays: Number(resolvedSlaDays),
                markedSectionId,
                status: status ?? 'RECEIVED',
                createdBy: userId,
                updatedBy: null,
                markedBy: null,
                markedAt: null,
            },
            { transaction }
        );

        // 12. Create audit record
        await Audit.create(
            {
                entity: EntityType.AVAK,
                entityId: avak.id,
                action: 'Create',
                performedBy: userId,
                remarks:
                    `AVAK "${avak.avakNumber}" created successfully. ` +
                    `Sender ID: ${resolvedSenderId}. ` +
                    `Branch ID: ${resolvedBranchId ?? 'None'}. ` +
                    `New sender created: ${senderCreated}.`,
                ipAddress:
                    req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        // 13. Commit transaction
        await transaction.commit();
        transaction = undefined;

        return res.status(201).json({
            message: `AVAK created successfully. AVAK Number: ${avak.avakNumber}`,
            data: {
                ...avak.toJSON(),
                senderCreated,
            },
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

        console.error('createAvak error:', error);

        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeUniqueConstraintError'
        ) {
            return res.status(400).json({
                message: 'Validation failed while creating AVAK',
                error: error.message,
            });
        }

        return res.status(500).json({
            message: 'Failed to create AVAK',
            error: error.message,
        });
    }
};


export const updateAvak = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {

        const {
            id,
            registrationDate,
            letterReferenceNumber,
            letterDate,
            subject,
            briefDescription,
            correspondenceType,
            priority,
            confidentiality,
            senderId,
            sender,
            receivingMode,
            branchId,
            slaDays,
            markedSectionId,
            status,
        } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'Unauthorized. User information not found.',
            });
        }

        transaction = await sequelize.transaction();

        const avak = await Avak.findByPk(id, { transaction });

        if (!avak) {
            await transaction.rollback();
            transaction = undefined;

            return res.status(404).json({
                message: 'AVAK not found.',
            });
        }

        // Sender ID and sender details cannot be provided together.
        if (senderId && sender) {
            await transaction.rollback();
            transaction = undefined;

            return res.status(400).json({
                message: 'Provide either senderId or sender details, not both.',
            });
        }

        // Validate and resolve sender.
        let resolvedSenderId = avak.senderId;
        let resolvedBranchId =
            branchId !== undefined ? branchId : avak.branchId;
        let senderCreated = false;

        if (senderId) {
            const existingSender = await Sender.findByPk(senderId, {
                transaction,
            });

            if (!existingSender) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(404).json({
                    message: 'Sender not found.',
                });
            }

            if (!existingSender.activeFlag) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'Selected sender is inactive.',
                });
            }

            resolvedSenderId = existingSender.id;

            // If the sender changes and no branch is supplied,
            // clear the old branch to avoid an invalid relationship.
            if (resolvedSenderId !== avak.senderId && branchId === undefined) {
                resolvedBranchId = null;
            }
        } else if (sender) {
            const requiredSenderFields = [
                'senderName',
                'senderType',
                'organization',
                'designation',
                'address',
                'district',
                'taluka',
                'pinCode',
                'mobile',
            ];

            const missingFields = requiredSenderFields.filter(
                (field) =>
                    typeof sender[field] !== 'string' ||
                    !sender[field].trim()
            );

            if (missingFields.length > 0) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'Required sender details are missing.',
                    missingFields,
                });
            }

            if (!/^\d{6}$/.test(sender.pinCode.trim())) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'PIN code must contain exactly 6 digits.',
                });
            }

            if (!/^\d{10}$/.test(sender.mobile.trim())) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'Mobile number must contain exactly 10 digits.',
                });
            }

            if (
                sender.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender.email.trim())
            ) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'Please provide a valid email address.',
                });
            }

            const newSender = await Sender.create(
                {
                    senderName: sender.senderName.trim(),
                    senderType: sender.senderType.trim(),
                    organization: sender.organization.trim(),
                    designation: sender.designation.trim(),
                    address: sender.address.trim(),
                    district: sender.district.trim(),
                    taluka: sender.taluka.trim(),
                    pinCode: sender.pinCode.trim(),
                    mobile: sender.mobile.trim(),
                    email: sender.email?.trim() || null,
                    activeFlag: true,
                    createdBy: userId,
                    createdOn: new Date(),
                },
                { transaction }
            );

            resolvedSenderId = newSender.id;
            resolvedBranchId = null;
            senderCreated = true;
        }

        // If a branch is supplied, it must belong to the resolved sender.
        if (resolvedBranchId) {
            const branch = await Branch.findOne({
                where: {
                    id: resolvedBranchId,
                    senderId: resolvedSenderId,
                },
                transaction,
            });

            if (!branch) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'Selected branch does not belong to the selected sender.',
                });
            }
        }

        // Validate section if supplied.
        const resolvedSectionId =
            markedSectionId !== undefined
                ? markedSectionId
                : avak.markedSectionId;

        if (markedSectionId !== undefined) {
            const section = await Section.findByPk(markedSectionId, {
                transaction,
            });

            if (!section) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(404).json({
                    message: 'Marked section not found.',
                });
            }
        }

        // Validate SLA days if supplied.
        if (slaDays !== undefined) {
            const parsedSlaDays = Number(slaDays);

            if (
                !Number.isInteger(parsedSlaDays) ||
                parsedSlaDays < 0
            ) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'SLA days must be a non-negative integer.',
                });
            }
        }

        // Update only fields supplied in the request.
        await avak.update(
            {
                ...(registrationDate !== undefined && {
                    registrationDate,
                }),
                ...(letterReferenceNumber !== undefined && {
                    letterReferenceNumber:
                        letterReferenceNumber?.trim() || null,
                }),
                ...(letterDate !== undefined && {
                    letterDate: letterDate || null,
                }),
                ...(subject !== undefined && {
                    subject: subject.trim(),
                }),
                ...(briefDescription !== undefined && {
                    briefDescription: briefDescription?.trim() || null,
                }),
                ...(correspondenceType !== undefined && {
                    correspondenceType,
                }),
                ...(priority !== undefined && { priority }),
                ...(confidentiality !== undefined && { confidentiality }),
                senderId: resolvedSenderId,
                ...(receivingMode !== undefined && { receivingMode }),
                branchId: resolvedBranchId,
                ...(slaDays !== undefined && {
                    slaDays: Number(slaDays),
                }),
                markedSectionId: resolvedSectionId,
                ...(status !== undefined && { status }),
                updatedBy: userId,
            },
            { transaction }
        );

        // Create audit record in the same transaction.
        await Audit.create(
            {
                entity: EntityType.AVAK,
                entityId: avak.id,
                action: 'Update',
                performedBy: userId,
                remarks: `AVAK "${avak.avakNumber}" updated successfully. Sender ID: ${resolvedSenderId}. Branch ID: ${resolvedBranchId ?? 'None'}. New sender created: ${senderCreated}.`,
                ipAddress:
                    req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        transaction = undefined;

        return res.status(200).json({
            message: `AVAK updated successfully. AVAK Number: ${avak.avakNumber}`,
            data: {
                ...avak.toJSON(),
                senderCreated,
            },
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

        console.error('updateAvak error:', error);

        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeUniqueConstraintError'
        ) {
            return res.status(400).json({
                message: 'Validation failed while updating AVAK.',
                error: error.message,
            });
        }

        return res.status(500).json({
            message: 'Failed to update AVAK.',
            error: error.message,
        });
    }
};




export const getAllAvak = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = '1',
            limit = '10',
            avakNumber,
            letterReferenceNumber,
            createdDate,
            fromDate,
            toDate,
            status,
            priority,
            confidentiality,
            correspondenceType,
        } = req.query;

        // Validate pagination.
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

        // Validate date format and actual calendar date.
        const isValidDate = (value: unknown): value is string => {
            if (
                typeof value !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(value)
            ) {
                return false;
            }

            const date = new Date(`${value}T00:00:00.000Z`);

            return (
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        };

        if (
            createdDate !== undefined &&
            (!isValidDate(createdDate) ||
                fromDate !== undefined ||
                toDate !== undefined)
        ) {
            return res.status(400).json({
                message:
                    'Use a valid createdDate (YYYY-MM-DD) OR fromDate/toDate, not both.',
            });
        }

        if (
            fromDate !== undefined &&
            !isValidDate(fromDate)
        ) {
            return res.status(400).json({
                message: 'fromDate must be a valid date in YYYY-MM-DD format.',
            });
        }

        if (
            toDate !== undefined &&
            !isValidDate(toDate)
        ) {
            return res.status(400).json({
                message: 'toDate must be a valid date in YYYY-MM-DD format.',
            });
        }

        if (
            isValidDate(fromDate) &&
            isValidDate(toDate) &&
            fromDate > toDate
        ) {
            return res.status(400).json({
                message: 'fromDate cannot be later than toDate.',
            });
        }

        const where: WhereOptions = {};

        // Partial search filters.
        if (typeof avakNumber === 'string' && avakNumber.trim()) {
            where['avakNumber'] = {
                [Op.iLike]: `%${avakNumber.trim()}%`,
            };
        }

        if (
            typeof letterReferenceNumber === 'string' &&
            letterReferenceNumber.trim()
        ) {
            where['letterReferenceNumber'] = {
                [Op.iLike]: `%${letterReferenceNumber.trim()}%`,
            };
        }

        // Exact-match filters.
        if (typeof status === 'string' && status.trim()) {
            where['status'] = status.trim();
        }

        if (typeof priority === 'string' && priority.trim()) {
            where['priority'] = priority.trim();
        }

        if (
            typeof confidentiality === 'string' &&
            confidentiality.trim()
        ) {
            where['confidentiality'] = confidentiality.trim();
        }

        if (
            typeof correspondenceType === 'string' &&
            correspondenceType.trim()
        ) {
            where['correspondenceType'] = correspondenceType.trim();
        }

        // createdAt date filtering.
        const createdAtFilter: {
            [Op.gte]?: Date;
            [Op.lt]?: Date;
        } = {};

        if (isValidDate(createdDate)) {
            createdAtFilter[Op.gte] = new Date(
                `${createdDate}T00:00:00.000Z`
            );

            const nextDay = new Date(
                `${createdDate}T00:00:00.000Z`
            );
            nextDay.setUTCDate(nextDay.getUTCDate() + 1);

            createdAtFilter[Op.lt] = nextDay;
        } else {
            if (isValidDate(fromDate)) {
                createdAtFilter[Op.gte] = new Date(
                    `${fromDate}T00:00:00.000Z`
                );
            }

            if (isValidDate(toDate)) {
                const dayAfterToDate = new Date(
                    `${toDate}T00:00:00.000Z`
                );
                dayAfterToDate.setUTCDate(
                    dayAfterToDate.getUTCDate() + 1
                );

                // Includes the entire toDate.
                createdAtFilter[Op.lt] = dayAfterToDate;
            }
        }

        if (Object.keys(createdAtFilter).length > 0) {
            where['createdAt'] = createdAtFilter;
        }

        const offset = (pageNumber - 1) * pageSize;

        const { count, rows } = await Avak.findAndCountAll({
            where,
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
                },
            ],
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']],
        });

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            message: 'AVAK records fetched successfully.',
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
        console.error('getAllAvak error:', error);

        return res.status(500).json({
            message: 'Failed to fetch AVAK records.',
            error: error.message,
        });
    }
};


export const getAvakById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'AVAK ID is required.',
            });
        }

        const avak = await Avak.findByPk(id, {
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
                },
            ],
        });

        if (!avak) {
            return res.status(404).json({
                message: 'AVAK not found.',
            });
        }

        return res.status(200).json({
            message: `AVAK fetched successfully. AVAK Number: ${avak.avakNumber}`,
            data: avak,
        });
    } catch (error: any) {
        console.error('getAvakById error:', error);

        return res.status(500).json({
            message: 'Failed to fetch AVAK.',
            error: error.message,
        });
    }
};