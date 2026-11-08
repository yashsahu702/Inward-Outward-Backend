import { Response } from 'express';
import { Transaction } from 'sequelize';

import { Avak } from '../models/avak.model';
import { Sender } from '../models/sender.model';
import { Branch } from '../models/branch.model';
import { Section } from '../models/section.model';
import { AuthRequest } from '../types/auth.types';
import { Audit, BranchSection, Javak, sequelize } from '../models';
import { EntityType } from '../models/enums';
import { Op, WhereOptions } from 'sequelize';
import { Document } from '../models/document.model';
import { DocumentType } from '../models/enums';

export const createAvak = async (
    req: AuthRequest,
    res: Response
) => {
    let transaction: Transaction | undefined;

    try {
        const {
            registrationDate,
            caseNumber,
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
            branchSectionId,
            slaDays,
            markedSectionId,
            status,
             // New fields
    receivingDate,
    isDocumentCollectedFromSender,
    sendingDocumentToSectionOfficerDate,
    sendingDocumentMode,
    isInspection,
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
        // A branch is required when a branch section is selected.
if (branchSectionId && !branchId) {
    return res.status(400).json({
        message: 'branchId is required when branchSectionId is provided',
    });
}

// A branch section can only be selected for an existing sender.
if (branchSectionId && !senderId) {
    return res.status(400).json({
        message:
            'branchSectionId can only be provided when an existing senderId is selected',
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
            if (branchSectionId) {
    const branchSection = await BranchSection.findOne({
        where: {
            id: branchSectionId,
            branchId,
        },
    });

    if (!branchSection) {
        return res.status(400).json({
            message:
                'Selected branch section does not belong to the selected branch',
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
                caseNumber,
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
                 receivingDate: receivingDate || null,

                    isDocumentCollectedFromSender:
                    isDocumentCollectedFromSender ?? false,

                   sendingDocumentToSectionOfficerDate:
                      sendingDocumentToSectionOfficerDate || null,

                    sendingDocumentMode:
                     sendingDocumentMode?.trim() || null,

                    isInspection: isInspection ?? false,

                branchId: resolvedBranchId,
                branchSectionId: branchSectionId ?? null,
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

        //12. Create automatically a new Javak for this avak

        const javak = await Javak.create(
  {
    avakId: avak.id,
    createdBy: userId,
    isDocumentReceived: false,
    receivedDocumentDate: null,
    actionRemarks: null,
    status: 'Pending',
    dispatchMode: null,
  },
  { transaction }
);

        // 13. Create audit record
        await Audit.create(
            {
                entity: EntityType.AVAK,
                entityId: avak.id,
                action: 'Create',
                performedBy: userId,
                remarks:
                    `AVAK "${avak.avakNumber}" created successfully. ` +
                    `JAVAK "${javak.javakNumber}" created successfully. ` +
                    `Sender ID: ${resolvedSenderId}. ` +
                    `Branch ID: ${resolvedBranchId ?? 'None'}. ` +
                    `New sender created: ${senderCreated}.`,
                ipAddress:
                    req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        // 14. Commit transaction
        await transaction.commit();
        transaction = undefined;

        return res.status(201).json({
            message: `AVAK created successfully. AVAK Number: ${avak.avakNumber}`,
            data: {
                ...avak.toJSON(),
                javak: javak.toJSON(),
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
            caseNumber,
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
            branchSectionId,
            slaDays,
            markedSectionId,
            status,
            receivingDate,
            isDocumentCollectedFromSender,
            sendingDocumentToSectionOfficerDate,
            sendingDocumentMode,
            isInspection,
        } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'Unauthorized. User information not found.',
            });
        }

        if (!id) {
            return res.status(400).json({
                message: 'AVAK ID is required.',
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

        // Resolve sender and branch.
        let resolvedSenderId = avak.senderId;
        let resolvedBranchId =
            branchId !== undefined ? branchId || null : avak.branchId;

        let senderCreated = false;

        // Validate an existing sender.
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

            // If sender changes without a branch, clear the previous branch.
            if (
                resolvedSenderId !== avak.senderId &&
                branchId === undefined
            ) {
                resolvedBranchId = null;
            }
        } else if (sender) {
            // Validate required fields for a new sender.
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

        // A branch or branch section cannot be selected without a sender.
        if (
            (branchId !== undefined && branchId && !resolvedSenderId) ||
            (branchSectionId && !resolvedSenderId)
        ) {
            await transaction.rollback();
            transaction = undefined;

            return res.status(400).json({
                message: 'A sender is required when selecting a branch or branch section.',
            });
        }

        // Validate that the resolved branch belongs to the resolved sender.
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
                    message:
                        'Selected branch does not belong to the selected sender.',
                });
            }
        }

        // Resolve branch section:
        // 1. If supplied, use the requested value.
        // 2. If omitted and branch is unchanged, preserve the existing value.
        // 3. If branch changes, clear the old section.
        const resolvedBranchSectionId =
            branchSectionId !== undefined
                ? branchSectionId || null
                : resolvedBranchId === avak.branchId
                  ? avak.branchSectionId
                  : null;

        // If a section ID is supplied, require branchId in this request.
        if (branchSectionId && !branchId) {
            await transaction.rollback();
            transaction = undefined;

            return res.status(400).json({
                message: 'branchId is required when branchSectionId is provided.',
            });
        }

        // Validate that the selected branch section belongs to the resolved branch.
        if (resolvedBranchSectionId) {
            if (!resolvedBranchId) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message: 'A branch is required when a branch section is selected.',
                });
            }

            const branchSection = await BranchSection.findOne({
                where: {
                    id: resolvedBranchSectionId,
                    branchId: resolvedBranchId,
                },
                transaction,
            });

            if (!branchSection) {
                await transaction.rollback();
                transaction = undefined;

                return res.status(400).json({
                    message:
                        'Selected branch section does not belong to the selected branch.',
                });
            }
        }

        // Resolve and validate marked section separately.
        const resolvedSectionId =
            markedSectionId !== undefined
                ? markedSectionId
                : avak.markedSectionId;

        if (markedSectionId !== undefined && markedSectionId !== null) {
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

        // Validate SLA days.
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

                ...(caseNumber !== undefined && {
                    caseNumber: caseNumber?.trim() || null,
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

                ...(receivingMode !== undefined && {
                    receivingMode,
                }),

                ...(receivingDate !== undefined && {
                    receivingDate: receivingDate || null,
                }),

                ...(isDocumentCollectedFromSender !== undefined && {
                    isDocumentCollectedFromSender,
                }),

                ...(sendingDocumentToSectionOfficerDate !== undefined && {
                    sendingDocumentToSectionOfficerDate:
                        sendingDocumentToSectionOfficerDate || null,
                }),

                ...(sendingDocumentMode !== undefined && {
                    sendingDocumentMode:
                        sendingDocumentMode?.trim() || null,
                }),

                ...(isInspection !== undefined && {
                    isInspection,
                }),

                branchId: resolvedBranchId,
                branchSectionId: resolvedBranchSectionId,

                ...(slaDays !== undefined && {
                    slaDays: Number(slaDays),
                }),

                markedSectionId: resolvedSectionId,

                ...(status !== undefined && { status }),

                updatedBy: userId,
            },
            { transaction }
        );

        // Create audit record within the same transaction.
        await Audit.create(
            {
                entity: EntityType.AVAK,
                entityId: avak.id,
                action: 'Update',
                performedBy: userId,
                remarks: `AVAK "${avak.avakNumber}" updated successfully. Sender ID: ${resolvedSenderId}. Branch ID: ${resolvedBranchId ?? 'None'}. Branch Section ID: ${resolvedBranchSectionId ?? 'None'}. New sender created: ${senderCreated}.`,
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

        // Validate pagination
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
                message:
                    'Page must be positive and limit must be between 1 and 100.',
            });
        }

        // Validate date format and actual calendar date
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

        if (fromDate !== undefined && !isValidDate(fromDate)) {
            return res.status(400).json({
                message: 'fromDate must be a valid date in YYYY-MM-DD format.',
            });
        }

        if (toDate !== undefined && !isValidDate(toDate)) {
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

        // Partial search filters
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

        // Exact-match filters
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

        // createdAt date filtering
        const createdAtFilter: {
            [Op.gte]?: Date;
            [Op.lt]?: Date;
        } = {};

        if (isValidDate(createdDate)) {
            createdAtFilter[Op.gte] = new Date(
                `${createdDate}T00:00:00.000Z`
            );

            const nextDay = new Date(`${createdDate}T00:00:00.000Z`);
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

                // Includes the entire toDate
                createdAtFilter[Op.lt] = dayAfterToDate;
            }
        }

        if (Object.keys(createdAtFilter).length > 0) {
            where['createdAt'] = createdAtFilter;
        }

        const offset = (pageNumber - 1) * pageSize;

        // Fetch paginated AVAK records
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
                    attributes: [
                        'id',
                        'branchName',
                        'branchCode',
                    ],
                    required: false,
                },
                {
                    model: Section,
                    as: 'markedSection',
                    attributes: [
                        'id',
                        'sectionName',
                        'sectionCode',
                    ],
                },
            ],
            limit: pageSize,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        // Fetch only the selected branch section for each AVAK.
        // No Avak-BranchSection association is required.
        const dataWithSenderDetails = await Promise.all(
            rows.map(async (avak) => {
                const avakData = avak.toJSON() as any;

                const {
                    branch: selectedBranch,
                    sender: selectedSender,
                    ...remainingAvakData
                } = avakData;

                let selectedBranchSection = null;

                if (avak.branchId && avak.branchSectionId) {
                    selectedBranchSection =
                        await BranchSection.findOne({
                            where: {
                                id: avak.branchSectionId,
                                branchId: avak.branchId,
                            },
                            attributes: [
                                'id',
                                'branchSectionName',
                                'branchSectionCode',
                                'branchId',
                            ],
                        });
                }

                // Place branch and its selected section inside sender.
                const senderWithBranch = selectedSender
                    ? {
                          ...selectedSender,
                          branch: selectedBranch
                              ? {
                                    ...selectedBranch,
                                    branchSection:
                                        selectedBranchSection
                                            ? selectedBranchSection.toJSON()
                                            : null,
                                }
                              : null,
                      }
                    : null;

                return {
                    ...remainingAvakData,
                    sender: senderWithBranch,
                };
            })
        );

        // Fetch documents belonging to the AVAK records on this page
        const avakIds = rows.map((avak) => avak.id);

        const documents = avakIds.length
            ? await Document.findAll({
                  where: {
                      entityId: {
                          [Op.in]: avakIds,
                      },
                      documentType: DocumentType.AVAK_DOC,
                  },
                  order: [['createdAt', 'ASC']],
              })
            : [];

        // Group documents by AVAK ID
        const documentsByAvakId = new Map<
            string,
            typeof documents
        >();

        for (const document of documents) {
            const entityId = document.entityId;
            const existingDocuments =
                documentsByAvakId.get(entityId) ?? [];

            existingDocuments.push(document);
            documentsByAvakId.set(entityId, existingDocuments);
        }

        // Attach documents to each AVAK record
        const data = dataWithSenderDetails.map((avakData) => ({
            ...avakData,
            documents: documentsByAvakId.get(avakData.id) ?? [],
        }));

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
            data,
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

        // Fetch AVAK documents in ascending order
        const documents = await Document.findAll({
            where: {
                entityId: avak.id,
                documentType: DocumentType.AVAK_DOC,
            },
            order: [['createdAt', 'ASC']],
        });

        // Convert AVAK instance to a plain object
        const avakData = avak.toJSON() as any;

        // Extract branch and sender from the AVAK response
        const {
            branch: selectedBranch,
            sender: selectedSender,
            ...remainingAvakData
        } = avakData;

        let selectedBranchSection = null;

        // Fetch branch section only when both IDs are available
        if (avak.branchId && avak.branchSectionId) {
            selectedBranchSection = await BranchSection.findOne({
                where: {
                    id: avak.branchSectionId,
                    branchId: avak.branchId,
                },
                attributes: [
                    'id',
                    'branchSectionName',
                    'branchSectionCode',
                    'branchId',
                ],
            });
        }

        // Nest branch and branch section inside sender
        const senderWithBranch = selectedSender
            ? {
                  ...selectedSender,
                  ...(selectedBranch && {
                      branch: {
                          ...selectedBranch,
                          ...(selectedBranchSection && {
                              branchSection: selectedBranchSection.toJSON(),
                          }),
                      },
                  }),
              }
            : null;

        return res.status(200).json({
            message: `AVAK fetched successfully. AVAK Number: ${avak.avakNumber}`,
            data: {
                ...remainingAvakData,
                sender: senderWithBranch,
                documents,
            },
        });
    } catch (error: any) {
        console.error('getAvakById error:', error);

        return res.status(500).json({
            message: 'Failed to fetch AVAK.',
            error: error.message,
        });
    }
};




export const getAvakByCaseNo = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { caseNo } = req.params;

        // -----------------------------------------
        // 1. VALIDATE CASE NUMBER
        // -----------------------------------------

        if (!caseNo || !caseNo.trim()) {
            return res.status(400).json({
                message: 'Case number is required.'
            });
        }

        const caseNumber = caseNo.trim();

        // -----------------------------------------
        // 2. FETCH AVAKS BY CASE NUMBER
        // -----------------------------------------

        const avaks = await Avak.findAll({
            where: {
                caseNumber: {
                    [Op.eq]: caseNumber
                }
            },
            include: [
                {
                    model: Sender,
                    as: 'sender',
                    required: false
                },
                {
                    model: Section,
                    as: 'markedSection',
                    required: false
                }
            ],
            order: [
                ['registrationDate', 'ASC'],
                ['createdAt', 'ASC']
            ]
        });

        if (!avaks.length) {
            return res.status(404).json({
                message: 'No Avak records found for this case number.',
                data: {
                    caseNumber,
                    totalAvaks: 0,
                    totalJavaks: 0,
                    avaks: [],
                    javaks: [],
                    documents: []
                }
            });
        }

        // -----------------------------------------
        // 3. GET AVAK, BRANCH AND SECTION IDS
        // -----------------------------------------

        const avakIds = avaks.map(avak => avak.id);

        const branchIds = [
            ...new Set(
                avaks
                    .map(avak => avak.branchId)
                    .filter((id): id is string => !!id)
            )
        ];

        const branchSectionIds = [
            ...new Set(
                avaks
                    .map(avak => avak.branchSectionId)
                    .filter((id): id is string => !!id)
            )
        ];

        // -----------------------------------------
        // 4. FETCH EXACT BRANCHES AND BRANCH SECTIONS
        // -----------------------------------------

        const [
            branches,
            branchSections
        ] = await Promise.all([

            branchIds.length
                ? Branch.findAll({
                    where: {
                        id: {
                            [Op.in]: branchIds
                        }
                    },
                    raw: true
                })
                : Promise.resolve([]),

            branchSectionIds.length
                ? BranchSection.findAll({
                    where: {
                        id: {
                            [Op.in]: branchSectionIds
                        }
                    },
                    raw: true
                })
                : Promise.resolve([])
        ]);

        const branchMap = new Map(
            (branches as any[]).map(branch => [
                branch.id,
                branch
            ])
        );

        const branchSectionMap = new Map(
            (branchSections as any[]).map(section => [
                section.id,
                section
            ])
        );

        // -----------------------------------------
        // 5. FETCH RELATED JAVAKS
        // -----------------------------------------

        const javaks = await Javak.findAll({
            where: {
                avakId: {
                    [Op.in]: avakIds
                }
            },
            order: [
                ['createdAt', 'ASC']
            ]
        });

        const javakIds = javaks.map(javak => javak.id);

        const javakMap = new Map<string, Javak>();

        for (const javak of javaks) {
            javakMap.set(javak.avakId, javak);
        }

        // -----------------------------------------
        // 6. FETCH ALL AVAK AND JAVAK DOCUMENTS
        // -----------------------------------------

        const documentConditions: any[] = [];

        if (avakIds.length) {
            documentConditions.push({
                entityId: {
                    [Op.in]: avakIds
                },
                documentType: DocumentType.AVAK_DOC
            });
        }

        if (javakIds.length) {
            documentConditions.push({
                entityId: {
                    [Op.in]: javakIds
                },
                documentType: DocumentType.JAVAK_DOC
            });
        }

        const allDocuments = documentConditions.length
            ? await Document.findAll({
                where: {
                    [Op.or]: documentConditions
                },
                order: [
                    ['createdAt', 'ASC']
                ]
            })
            : [];

        // -----------------------------------------
        // 7. GROUP DOCUMENTS BY ENTITY ID
        // -----------------------------------------

        const avakDocumentsMap = new Map<string, any[]>();
        const javakDocumentsMap = new Map<string, any[]>();

        for (const document of allDocuments) {
            const doc: any = document.toJSON();

            if (doc.documentType === DocumentType.AVAK_DOC) {
                const existing =
                    avakDocumentsMap.get(doc.entityId) || [];

                existing.push(doc);

                avakDocumentsMap.set(doc.entityId, existing);
            }

            if (doc.documentType === DocumentType.JAVAK_DOC) {
                const existing =
                    javakDocumentsMap.get(doc.entityId) || [];

                existing.push(doc);

                javakDocumentsMap.set(doc.entityId, existing);
            }
        }

        // -----------------------------------------
        // 8. FORMAT AVAKS WITH BRANCH, SECTION,
        // DOCUMENTS AND RELATED JAVAK
        // -----------------------------------------

        const formattedAvaks = avaks.map(avak => {
            const avakData: any = avak.toJSON();

            const relatedJavak = javakMap.get(avak.id);

            return {
                ...avakData,

                branch: avak.branchId
                    ? branchMap.get(avak.branchId) || null
                    : null,

                branchSection: avak.branchSectionId
                    ? branchSectionMap.get(avak.branchSectionId) || null
                    : null,

                documents:
                    avakDocumentsMap.get(avak.id) || [],

                javak: relatedJavak
                    ? {
                        ...relatedJavak.toJSON(),
                        documents:
                            javakDocumentsMap.get(relatedJavak.id) || []
                    }
                    : null
            };
        });

        // -----------------------------------------
        // 9. FORMAT JAVAKS WITH DOCUMENTS
        // -----------------------------------------

        const formattedJavaks = javaks.map(javak => ({
            ...javak.toJSON(),

            documents:
                javakDocumentsMap.get(javak.id) || []
        }));

        // -----------------------------------------
        // 10. FINAL RESPONSE
        // -----------------------------------------

        return res.status(200).json({
            message: 'Case details fetched successfully.',

            data: {
                caseNumber,

                totalAvaks: formattedAvaks.length,

                totalJavaks: formattedJavaks.length,

                avaks: formattedAvaks,

                javaks: formattedJavaks,

                documents: allDocuments.map(
                    document => document.toJSON()
                )
            }
        });

    } catch (error: any) {
        console.error('getAvakByCaseNo error:', error);

        return res.status(500).json({
            message: 'Failed to fetch case details.',
            error: error.message
        });
    }
};


export const getAllCases = async (
    req: AuthRequest,
    res: Response
) => {
    try {

        // -----------------------------------------
        // 1. FETCH AVAKS HAVING CASE NUMBER
        // -----------------------------------------

        const avaks = await Avak.findAll({
            attributes: [
                'id',
                'caseNumber',
                'subject',
                'registrationDate',
                'createdAt'
            ],

            where: {
                caseNumber: {
                    [Op.not]: null,
                    [Op.ne]: ''
                }
            },

            include: [
                {
                    model: Sender,
                    as: 'sender',
                    attributes: ['senderName'],
                    required: false
                }
            ],

            order: [
                ['registrationDate', 'ASC'],
                ['createdAt', 'ASC']
            ]
        });

        // -----------------------------------------
        // 2. GROUP AVAKS BY CASE NUMBER
        // -----------------------------------------

        const caseMap = new Map<string, any>();

        for (const avak of avaks) {

            const avakData: any = avak.toJSON();

            const caseNumber = avakData.caseNumber;

            if (!caseMap.has(caseNumber)) {

                // First Avak of this case
                caseMap.set(caseNumber, {
                    caseNumber,

                    // Details from first Avak
                    senderName:
                        avakData.sender?.senderName ?? null,

                    subject:
                        avakData.subject ?? null,

                    totalAvaks: 0,
                    totalJavaks: 0
                });
            }

            // Increment Avak count
            caseMap.get(caseNumber).totalAvaks++;
        }

        // -----------------------------------------
        // 3. FETCH ALL JAVAKS WITH ASSOCIATED AVAK
        // -----------------------------------------

        const javaks = await Javak.findAll({
            attributes: [
                'id'
            ],

            include: [
                {
                    model: Avak,
                    as: 'avak',
                    attributes: [
                        'caseNumber'
                    ],
                    required: true,

                    where: {
                        caseNumber: {
                            [Op.not]: null,
                            [Op.ne]: ''
                        }
                    }
                }
            ]
        });

        // -----------------------------------------
        // 4. COUNT JAVAKS CASE-WISE
        // -----------------------------------------

        for (const javak of javaks) {

            const javakData: any = javak.toJSON();

            const caseNumber =
                javakData.avak?.caseNumber;

            if (caseNumber && caseMap.has(caseNumber)) {

                caseMap.get(caseNumber).totalJavaks++;
            }
        }

        // -----------------------------------------
        // 5. FINAL CASE ARRAY
        // -----------------------------------------

        const cases = Array.from(caseMap.values());

        // -----------------------------------------
        // 6. FINAL RESPONSE
        // -----------------------------------------

        return res.status(200).json({
            message: 'Cases fetched successfully.',

            data: {
                totalCases: cases.length,
                cases
            }
        });

    } catch (error: any) {

        console.error('getAllCases error:', error);

        return res.status(500).json({
            message: 'Failed to fetch cases.',
            error: error.message
        });
    }
};