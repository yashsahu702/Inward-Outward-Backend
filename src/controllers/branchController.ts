import { Response } from 'express';
import { Op, Transaction } from 'sequelize';
import { Branch } from '../models/branch.model';
import { Sender } from '../models/sender.model';
import { AuthRequest } from '../types/auth.types';
import { Audit, sequelize } from '../models';
import { EntityType } from '../models/enums';

export const createBranch = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const {
            branchName,
            branchCode,
            senderId,
            activeFlag,
        } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!branchName || !branchCode || !senderId) {
            return res.status(400).json({
                message: 'Branch name, branch code and sender ID are required',
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
                branchCode,
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
                branchName,
                branchCode,
                senderId,
                activeFlag: activeFlag ?? true,
                createdBy: userId,
                createdOn: new Date(),
            },
            { transaction }
        );

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

        return res.status(201).json({
            message: 'Branch created successfully',
            data: branch,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Transaction rollback error:', rollbackError);
            }
        }

        console.error('createBranch error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const {
            id,
            branchName,
            branchCode,
            senderId,
            activeFlag,
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
                    message: 'Branch code already exists for this sender',
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

        await Audit.create(
            {
                entity: EntityType.BRANCH,
                entityId: branch.id,
                action: 'Update',
                performedBy: userId,
                remarks: `Branch "${branch.branchName}" updated. Previous values: ${JSON.stringify(previousBranch)}`,
                ipAddress:
                    req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date(),
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            message: 'Branch updated successfully',
            data: branch,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Transaction rollback error:', rollbackError);
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
        const branches = await Branch.findAll({
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
            ],
            order: [['branchName', 'ASC']],
        });

        return res.status(200).json({
            message: 'Branches fetched successfully',
            data: branches,
        });
    } catch (error: any) {
        console.error('getBranches error:', error);

        return res.status(500).json({
            message: 'Failed to fetch branches',
            error: error?.message || error,
        });
    }
};

export const getBranchById = async (req: AuthRequest, res: Response) => {
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