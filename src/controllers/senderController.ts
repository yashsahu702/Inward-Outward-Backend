
import { Response } from 'express'
import { Sender } from '../models/sender.model'
import { AuthRequest } from '../types/auth.types'
import { Op } from 'sequelize'
import { sequelize, Audit } from '../models';
import { EntityType } from '../models/enums';
import { Transaction } from 'sequelize';

export const createSender = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const {
            senderName,
            senderType,
            organization,
            designation,
            address,
            district,
            taluka,
            pinCode,
            mobile,
            email,
            activeFlag,
        } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (
            !senderName ||
            !senderType ||
            !organization ||
            !designation ||
            !address ||
            !district ||
            !taluka ||
            !pinCode ||
            !mobile
        ) {
            return res.status(400).json({
                message: 'Please provide all required sender details',
            });
        }

        if (!/^\d{6}$/.test(String(pinCode))) {
            return res.status(400).json({
                message: 'PIN code must contain exactly 6 digits',
            });
        }

        if (!/^\d{10}$/.test(String(mobile))) {
            return res.status(400).json({
                message: 'Mobile number must contain exactly 10 digits',
            });
        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                message: 'Please provide a valid email address',
            });
        }

        const existingSender = await Sender.findOne({
            where: { mobile: String(mobile) },
        });

        if (existingSender) {
            return res.status(400).json({
                message: 'Mobile number already exists',
            });
        }

        if (email) {
            const existingEmail = await Sender.findOne({
                where: { email },
            });

            if (existingEmail) {
                return res.status(400).json({
                    message: 'Email already exists',
                });
            }
        }

        // Start transaction after validation
        transaction = await sequelize.transaction();

        const sender = await Sender.create(
            {
                senderName,
                senderType,
                organization,
                designation,
                address,
                district,
                taluka,
                pinCode: String(pinCode),
                mobile: String(mobile),
                email: email || null,
                activeFlag: activeFlag ?? true,
                createdBy: userId,
                createdOn: new Date(),
            },
            { transaction }
        );

        // Create audit record
        await Audit.create(
            {
                entity: EntityType.SENDER,
                entityId: sender.id,
                action: 'Create',
                performedBy: userId,
                remarks: `Sender "${sender.senderName}" created successfully`,
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
            message: 'Sender created successfully',
            data: sender,
        });
    } catch (error: any) {
         if (transaction) {
    try {
        await transaction.rollback();
    } catch (rollbackError) {
        console.error('Transaction rollback error:', rollbackError);
    }
}
        console.error('createSender error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export const updateSender = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const {
            id,
            senderName,
            senderType,
            organization,
            designation,
            address,
            district,
            taluka,
            pinCode,
            mobile,
            email,
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
                message: 'Sender ID is required',
            });
        }

        const sender = await Sender.findByPk(id);

        if (!sender) {
            return res.status(404).json({
                message: 'Sender not found',
            });
        }

        if (
            pinCode !== undefined &&
            !/^\d{6}$/.test(String(pinCode))
        ) {
            return res.status(400).json({
                message: 'PIN code must contain exactly 6 digits',
            });
        }

        if (
            mobile !== undefined &&
            !/^\d{10}$/.test(String(mobile))
        ) {
            return res.status(400).json({
                message: 'Mobile number must contain exactly 10 digits',
            });
        }

        if (mobile && String(mobile) !== sender.mobile) {
            const existingSender = await Sender.findOne({
                where: {
                    mobile: String(mobile),
                    id: { [Op.ne]: id },
                },
            });

            if (existingSender) {
                return res.status(400).json({
                    message: 'Mobile number already exists',
                });
            }
        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                message: 'Please provide a valid email address',
            });
        }

        if (email && email !== sender.email) {
            const existingEmail = await Sender.findOne({
                where: {
                    email,
                    id: { [Op.ne]: id },
                },
            });

            if (existingEmail) {
                return res.status(400).json({
                    message: 'Email already exists',
                });
            }
        }

        // Capture existing values before updating
        const previousSender = sender.toJSON();

        transaction = await sequelize.transaction();

        await sender.update(
            {
                senderName: senderName ?? sender.senderName,
                senderType: senderType ?? sender.senderType,
                organization: organization ?? sender.organization,
                designation: designation ?? sender.designation,
                address: address ?? sender.address,
                district: district ?? sender.district,
                taluka: taluka ?? sender.taluka,
                pinCode:
                    pinCode === undefined
                        ? sender.pinCode
                        : String(pinCode),
                mobile:
                    mobile === undefined
                        ? sender.mobile
                        : String(mobile),
                email: email === undefined ? sender.email : email || null,
                activeFlag: activeFlag ?? sender.activeFlag,
                updatedBy: userId,
                updatedOn: new Date(),
            },
            { transaction }
        );

        // Create audit record
        await Audit.create(
            {
                entity: EntityType.SENDER,
                entityId: sender.id,
                action: 'Update',
                performedBy: userId,
                remarks: `Sender "${sender.senderName}" updated. Previous values: ${JSON.stringify(previousSender)}`,
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
            message: 'Sender updated successfully',
            data: sender,
        });
    } catch (error: any) {
        if (transaction) {
    try {
        await transaction.rollback();
    } catch (rollbackError) {
        console.error('Transaction rollback error:', rollbackError);
    }
}

        console.error('updateSender error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export const getSenders = async (req: AuthRequest, res: Response) => {
    try {
        const senders = await Sender.findAll({
            order: [['senderName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Senders fetched successfully',
            data: senders,
        })
    } catch (error: any) {
        console.error('getSenders error:', error)

        return res.status(500).json({
            message: 'Failed to fetch senders',
            error: error?.message || error,
        })
    }
}

export const getSenderById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params

        const sender = await Sender.findByPk(id)

        if (!sender) {
            return res.status(404).json({
                message: 'Sender not found',
            })
        }

        return res.status(200).json({
            message: 'Sender fetched successfully',
            data: sender,
        })
    } catch (error: any) {
        console.error('getSenderById error:', error)

        return res.status(500).json({
            message: 'Failed to fetch sender',
            error: error?.message || error,
        })
    }
}

export const getSendersByType = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { senderType } = req.params;

    if (!senderType?.trim()) {
      return res.status(400).json({
        message: 'Sender type is required',
      });
    }

    const senders = await Sender.findAll({
      where: {
        senderType: {
          [Op.iLike]: senderType.trim(),
        },
      },
      order: [['senderName', 'ASC']],
    });

    return res.status(200).json({
      message: 'Senders fetched successfully',
      data: senders,
    });
  } catch (error: any) {
    console.error('Error fetching senders by type:', error);

    return res.status(500).json({
      message: 'Failed to fetch senders by type',
      error: error.message,
    });
  }
};

export const getSendersByOrganization = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { organization } = req.params;

    if (!organization?.trim()) {
      return res.status(400).json({
        message: 'Organization is required',
      });
    }

    const senders = await Sender.findAll({
      where: {
        organization: {
          [Op.iLike]: organization.trim(),
        },
      },
      order: [['senderName', 'ASC']],
    });

    return res.status(200).json({
      message: 'Senders fetched successfully',
      data: senders,
    });
  } catch (error: any) {
    console.error('Error fetching senders by organization:', error);

    return res.status(500).json({
      message: 'Failed to fetch senders by organization',
      error: error.message,
    });
  }
};
