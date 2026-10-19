import { Response } from 'express';
import { Op, Transaction } from 'sequelize';
import { Subject } from '../models/subject.model';
import { Sender } from '../models/sender.model';
import { AuthRequest } from '../types/auth.types';
import { sequelize, Audit } from '../models';
import { EntityType } from '../models/enums';

// CREATE SUBJECT
export const createSubject = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const {
            subjectName,
            subjectCode,
            senderId,
            activeFlag,
        } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!subjectName?.trim() || !senderId) {
            return res.status(400).json({
                message: 'Subject name and sender ID are required',
            });
        }

        const sender = await Sender.findByPk(senderId);

        if (!sender) {
            return res.status(404).json({
                message: 'Sender not found',
            });
        }

        if (subjectCode?.trim()) {
            const existingSubject = await Subject.findOne({
                where: {
                    subjectCode: subjectCode.trim(),
                },
            });

            if (existingSubject) {
                return res.status(400).json({
                    message: 'Subject code already exists',
                });
            }
        }

        transaction = await sequelize.transaction();

        const subject = await Subject.create(
            {
                subjectName: subjectName.trim(),
                subjectCode: subjectCode?.trim() || null,
                senderId,
                activeFlag: activeFlag ?? true,
                createdBy: userId,
                createdOn: new Date(),
            },
            { transaction }
        );

        await Audit.create(
            {
                entity: EntityType.SUBJECT,
                entityId: subject.id,
                action: 'Create',
                performedBy: userId,
                remarks: `Subject "${subject.subjectName}" created successfully`,
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
            message: 'Subject created successfully',
            data: subject,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Transaction rollback error:', rollbackError);
            }
        }

        console.error('createSubject error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// UPDATE SUBJECT
export const updateSubject = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const {
            id,
            subjectName,
            subjectCode,
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
                message: 'Subject ID is required',
            });
        }

        const subject = await Subject.findByPk(id);

        if (!subject) {
            return res.status(404).json({
                message: 'Subject not found',
            });
        }

        if (
            subjectCode !== undefined &&
            subjectCode?.trim() &&
            subjectCode.trim() !== subject.subjectCode
        ) {
            const existingSubject = await Subject.findOne({
                where: {
                    subjectCode: subjectCode.trim(),
                    id: { [Op.ne]: id },
                },
            });

            if (existingSubject) {
                return res.status(400).json({
                    message: 'Subject code already exists',
                });
            }
        }

        if (
            senderId !== undefined &&
            senderId !== subject.senderId
        ) {
            const sender = await Sender.findByPk(senderId);

            if (!sender) {
                return res.status(404).json({
                    message: 'Sender not found',
                });
            }
        }

        const previousSubject = subject.toJSON();

        transaction = await sequelize.transaction();

        await subject.update(
            {
                subjectName:
                    subjectName === undefined
                        ? subject.subjectName
                        : subjectName.trim(),

                subjectCode:
                    subjectCode === undefined
                        ? subject.subjectCode
                        : subjectCode?.trim() || null,

                senderId: senderId ?? subject.senderId,

                activeFlag: activeFlag ?? subject.activeFlag,
                updatedBy: userId,
                updatedOn: new Date(),
            },
            { transaction }
        );

        await Audit.create(
            {
                entity: EntityType.SUBJECT,
                entityId: subject.id,
                action: 'Update',
                performedBy: userId,
                remarks: `Subject "${subject.subjectName}" updated. Previous values: ${JSON.stringify(previousSubject)}`,
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
            message: 'Subject updated successfully',
            data: subject,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Transaction rollback error:', rollbackError);
            }
        }

        console.error('updateSubject error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// GET ALL SUBJECTS
export const getSubjects = async (req: AuthRequest, res: Response) => {
    try {
        const subjects = await Subject.findAll({
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
                    ],
                },
            ],
            order: [['subjectName', 'ASC']],
        });

        return res.status(200).json({
            message: 'Subjects fetched successfully',
            data: subjects,
        });
    } catch (error: any) {
        console.error('getSubjects error:', error);

        return res.status(500).json({
            message: 'Failed to fetch subjects',
            error: error?.message || error,
        });
    }
};

// GET SUBJECT BY ID
export const getSubjectById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const subject = await Subject.findByPk(id, {
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
                    ],
                },
            ],
        });

        if (!subject) {
            return res.status(404).json({
                message: 'Subject not found',
            });
        }

        return res.status(200).json({
            message: 'Subject fetched successfully',
            data: subject,
        });
    } catch (error: any) {
        console.error('getSubjectById error:', error);

        return res.status(500).json({
            message: 'Failed to fetch subject',
            error: error?.message || error,
        });
    }
};

// GET SUBJECTS BY SENDER ID
export const getSubjectsBySenderId = async (
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

        const subjects = await Subject.findAll({
            where: {
                senderId,
            },
            order: [['subjectName', 'ASC']],
        });

        return res.status(200).json({
            message: 'Subjects fetched successfully',
            data: subjects,
        });
    } catch (error: any) {
        console.error('getSubjectsBySenderId error:', error);

        return res.status(500).json({
            message: 'Failed to fetch subjects',
            error: error?.message || error,
        });
    }
};
