import { Response } from 'express';
import { Op, Transaction } from 'sequelize';
import { Branch } from '../models/branch.model';
import { Sender } from '../models/sender.model';
import { AuthRequest } from '../types/auth.types';
import { Audit, BranchSection, sequelize } from '../models';
import { EntityType } from '../models/enums';

export const createBranch = async (
    req: AuthRequest,
    res: Response
) => {
    let transaction: Transaction | undefined;

    try {
        const {
            branchName,
            branchCode,
            senderId,
            activeFlag,
            branchSections = [],
        } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (
            !branchName?.trim() ||
            !branchCode?.trim() ||
            !senderId
        ) {
            return res.status(400).json({
                message:
                    'Branch name, branch code and sender ID are required',
            });
        }

        if (
            !Array.isArray(branchSections) ||
            branchSections.some(
                (section: any) =>
                    !section ||
                    typeof section.branchSectionName !== 'string' ||
                    !section.branchSectionName.trim() ||
                    (
                        section.branchSectionCode != null &&
                        typeof section.branchSectionCode !== 'string'
                    )
            )
        ) {
            return res.status(400).json({
                message:
                    'branchSections must be an array of sections with a valid branchSectionName and optional branchSectionCode.',
            });
        }

        const sender = await Sender.findByPk(senderId);

        if (!sender) {
            return res.status(404).json({
                message: 'Sender not found',
            });
        }

        const existingBranch = await Branch.findOne({
            where: {
                branchCode: branchCode.trim(),
                senderId,
            },
        });

        if (existingBranch) {
            return res.status(400).json({
                message: 'Branch code already exists for this sender',
            });
        }

        transaction = await sequelize.transaction();

        const branch = await Branch.create(
            {
                branchName: branchName.trim(),
                branchCode: branchCode.trim(),
                senderId,
                activeFlag: activeFlag ?? true,
                createdBy: userId,
                createdOn: new Date(),
            },
            { transaction }
        );

        // Create multiple branch sections, if provided
        if (branchSections.length > 0) {
            await BranchSection.bulkCreate(
                branchSections.map((section: any) => ({
                    branchSectionName: section.branchSectionName.trim(),
                    branchSectionCode:
                        section.branchSectionCode?.trim() || null,
                    branchId: branch.id,
                })),
                { transaction }
            );
        }

        await Audit.create(
            {
                entity: EntityType.BRANCH,
                entityId: branch.id,
                action: 'Create',
                performedBy: userId,
                remarks: `Branch "${branch.branchName}" created successfully for sender "${sender.senderName}"`,
                ipAddress:
                    req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        transaction = undefined;

        const createdBranch = await Branch.findByPk(branch.id, {
            include: [
                {
                    model: BranchSection,
                    as: 'branchSections',
                },
            ],
        });

        return res.status(201).json({
            message: 'Branch created successfully',
            data: createdBranch,
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

        console.error('createBranch error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export const updateBranch = async (
    req: AuthRequest,
    res: Response
) => {
    let transaction: Transaction | undefined;

    try {
        const {
            id,
            branchName,
            branchCode,
            senderId,
            activeFlag,
            branchSections,
        } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!id) {
            return res.status(400).json({
                message: 'Branch ID is required',
            });
        }

        const branch = await Branch.findByPk(id);

        if (!branch) {
            return res.status(404).json({
                message: 'Branch not found',
            });
        }

        // Validate sections only when provided
        if (branchSections !== undefined) {
            if (
                !Array.isArray(branchSections) ||
                branchSections.some((section: any) => {
                    if (!section || typeof section !== 'object') {
                        return true;
                    }

                    if (
                        section.id !== undefined &&
                        typeof section.id !== 'string'
                    ) {
                        return true;
                    }

                    if (
                        section.branchSectionName !== undefined &&
                        (
                            typeof section.branchSectionName !== 'string' ||
                            !section.branchSectionName.trim()
                        )
                    ) {
                        return true;
                    }

                    if (
                        section.branchSectionCode !== undefined &&
                        section.branchSectionCode !== null &&
                        typeof section.branchSectionCode !== 'string'
                    ) {
                        return true;
                    }

                    // A new section must have a name
                    if (
                        !section.id &&
                        (
                            typeof section.branchSectionName !== 'string' ||
                            !section.branchSectionName.trim()
                        )
                    ) {
                        return true;
                    }

                    // An existing section must have at least one field to update
                    if (
                        section.id &&
                        section.branchSectionName === undefined &&
                        section.branchSectionCode === undefined
                    ) {
                        return true;
                    }

                    return false;
                })
            ) {
                return res.status(400).json({
                    message:
                        'Invalid branchSections. Existing sections require an ID and at least one field to update. New sections require a name.',
                });
            }
        }

        const newSenderId = senderId ?? branch.senderId;
        const newBranchCode = branchCode ?? branch.branchCode;

        if (senderId && senderId !== branch.senderId) {
            const sender = await Sender.findByPk(senderId);

            if (!sender) {
                return res.status(404).json({
                    message: 'Sender not found',
                });
            }
        }

        if (
            newBranchCode !== branch.branchCode ||
            newSenderId !== branch.senderId
        ) {
            const existingBranch = await Branch.findOne({
                where: {
                    branchCode: newBranchCode,
                    senderId: newSenderId,
                    id: { [Op.ne]: id },
                },
            });

            if (existingBranch) {
                return res.status(400).json({
                    message:
                        'Branch code already exists for this sender',
                });
            }
        }

        const previousBranch = branch.toJSON();

        transaction = await sequelize.transaction();

        await branch.update(
            {
                branchName: branchName ?? branch.branchName,
                branchCode: newBranchCode,
                senderId: newSenderId,
                activeFlag: activeFlag ?? branch.activeFlag,
                updatedBy: userId,
                updatedOn: new Date(),
            },
            { transaction }
        );

        // Update existing sections or insert new sections
        if (branchSections !== undefined) {
            for (const section of branchSections) {
                if (section.id) {
                    const existingSection =
                        await BranchSection.findOne({
                            where: {
                                id: section.id,
                                branchId: branch.id,
                            },
                            transaction,
                        });

                    if (!existingSection) {
                        await transaction.rollback();
                        transaction = undefined;

                        return res.status(400).json({
                            message:
                                `Branch section ${section.id} does not belong to this branch or does not exist.`,
                        });
                    }

                    const sectionUpdates: Record<string, any> = {};

                    if (section.branchSectionName !== undefined) {
                        sectionUpdates.branchSectionName =
                            section.branchSectionName.trim();
                    }

                    if (section.branchSectionCode !== undefined) {
                        sectionUpdates.branchSectionCode =
                            section.branchSectionCode === null
                                ? null
                                : section.branchSectionCode.trim() || null;
                    }

                    await existingSection.update(sectionUpdates, {
                        transaction,
                    });
                } else {
                    await BranchSection.create(
                        {
                            branchId: branch.id,
                            branchSectionName:
                                section.branchSectionName.trim(),
                            branchSectionCode:
                                section.branchSectionCode?.trim() || null,
                        },
                        { transaction }
                    );
                }
            }
        }

        await Audit.create(
            {
                entity: EntityType.BRANCH,
                entityId: branch.id,
                action: 'Update',
                performedBy: userId,
                remarks:
                    `Branch "${branch.branchName}" updated. Previous values: ${JSON.stringify(previousBranch)}`,
                ipAddress:
                    req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        transaction = undefined;

        const updatedBranch = await Branch.findByPk(branch.id, {
            include: [
                {
                    model: BranchSection,
                    as: 'branchSections',
                },
            ],
        });

        return res.status(200).json({
            message: 'Branch updated successfully',
            data: updatedBranch,
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

        console.error('updateBranch error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};




export const getBranches = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = '1',
            limit = '10',
            branchName,
            branchCode,
            organization,
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
                message:
                    'Page must be positive and limit must be between 1 and 100.',
            });
        }

        const branchWhere: any = {};
        const senderWhere: any = {};

        if (typeof branchName === 'string' && branchName.trim()) {
            branchWhere.branchName = {
                [Op.iLike]: `%${branchName.trim()}%`,
            };
        }

        if (typeof branchCode === 'string' && branchCode.trim()) {
            branchWhere.branchCode = {
                [Op.iLike]: `%${branchCode.trim()}%`,
            };
        }

        if (typeof organization === 'string' && organization.trim()) {
            senderWhere.organization = {
                [Op.iLike]: `%${organization.trim()}%`,
            };
        }

        const { count, rows } = await Branch.findAndCountAll({
            where: branchWhere,
            include: [
                {
                    model: Sender,
                    as: 'sender',
                    attributes: [
                        'id',
                        'senderName',
                        'senderType',
                        'organization',
                        'email',
                    ],
                    where: senderWhere,
                    required: Object.keys(senderWhere).length > 0,
                },
                {
                    model: BranchSection,
                    as: 'branchSections',
                    required: false,
                },
            ],
            order: [['branchName', 'ASC']],
            limit: pageSize,
            offset: (pageNumber - 1) * pageSize,
            distinct: true,
        });

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            message: 'Branches fetched successfully',
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
        console.error('getBranches error:', error);

        return res.status(500).json({
            message: 'Failed to fetch branches',
            error: error?.message || error,
        });
    }
};



export const getBranchById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const branch = await Branch.findByPk(id, {
            include: [
                {
                    model: Sender,
                    as: 'sender',
                    attributes: [
                        'id',
                        'senderName',
                        'senderType',
                        'organization',
                    ],
                },
                {
                    model: BranchSection,
                    as: 'branchSections',
                    required: false,
                },
            ],
        });

        if (!branch) {
            return res.status(404).json({
                message: 'Branch not found',
            });
        }

        return res.status(200).json({
            message: 'Branch fetched successfully',
            data: branch,
        });
    } catch (error: any) {
        console.error('getBranchById error:', error);

        return res.status(500).json({
            message: 'Failed to fetch branch',
            error: error?.message || error,
        });
    }
};



export const getBranchesBySenderId = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { senderId } = req.params;

        const sender = await Sender.findByPk(senderId);

        if (!sender) {
            return res.status(404).json({
                message: 'Sender not found',
            });
        }

        const branches = await Branch.findAll({
            where: {
                senderId,
            },
            include: [
                {
                    model: BranchSection,
                    as: 'branchSections',
                    required: false,
                },
            ],
            order: [['branchName', 'ASC']],
        });

        return res.status(200).json({
            message: 'Branches fetched successfully',
            data: branches,
        });
    } catch (error: any) {
        console.error('getBranchesBySenderId error:', error);

        return res.status(500).json({
            message: 'Failed to fetch branches',
            error: error?.message || error,
        });
    }
};
