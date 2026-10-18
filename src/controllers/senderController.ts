
import { Response } from 'express'
import { Sender } from '../models/sender.model'
import { AuthRequest } from '../types/auth.types'
import { Op } from 'sequelize'

export const createSender = async (req: AuthRequest, res: Response) => {
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
        } = req.body

        const userId = req.user?.id

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
            })
        }

        // Validate PIN code
        if (!/^\d{6}$/.test(String(pinCode))) {
            return res.status(400).json({
                message: 'PIN code must contain exactly 6 digits',
            })
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(String(mobile))) {
            return res.status(400).json({
                message: 'Mobile number must contain exactly 10 digits',
            })
        }

        // Validate email if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: 'Please provide a valid email address',
            })
        }

        // Check duplicate mobile number
        const existingSender = await Sender.findOne({
            where: { mobile },
        })

        if (existingSender) {
            return res.status(400).json({
                message: 'Mobile number already exists',
            })
        }

        // Check duplicate email if provided
        if (email) {
            const existingEmail = await Sender.findOne({
                where: { email },
            })

            if (existingEmail) {
                return res.status(400).json({
                    message: 'Email already exists',
                })
            }
        }

        const sender = await Sender.create({
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
            createdBy: userId ?? null,
            createdOn: new Date(),
        })

        return res.status(201).json({
            message: 'Sender created successfully',
            data: sender,
        })
    } catch (error: any) {
        console.error('createSender error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

export const updateSender = async (req: AuthRequest, res: Response) => {
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
        } = req.body

        const userId = req.user?.id

        if (!id) {
            return res.status(400).json({
                message: 'Sender ID is required',
            })
        }

        const sender = await Sender.findByPk(id)

        if (!sender) {
            return res.status(404).json({
                message: 'Sender not found',
            })
        }

        // Validate changed PIN code
        if (
            pinCode !== undefined &&
            !/^\d{6}$/.test(String(pinCode))
        ) {
            return res.status(400).json({
                message: 'PIN code must contain exactly 6 digits',
            })
        }

        // Validate changed mobile number
        if (
            mobile !== undefined &&
            !/^\d{10}$/.test(String(mobile))
        ) {
            return res.status(400).json({
                message: 'Mobile number must contain exactly 10 digits',
            })
        }

        // Check duplicate mobile number
        if (mobile && mobile !== sender.mobile) {
            const existingSender = await Sender.findOne({
                where: {
                    mobile,
                    id: { [Op.ne]: id },
                },
            })

            if (existingSender) {
                return res.status(400).json({
                    message: 'Mobile number already exists',
                })
            }
        }

        // Validate email if supplied
        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                message: 'Please provide a valid email address',
            })
        }

        // Check duplicate email
        if (email && email !== sender.email) {
            const existingEmail = await Sender.findOne({
                where: {
                    email,
                    id: { [Op.ne]: id },
                },
            })

            if (existingEmail) {
                return res.status(400).json({
                    message: 'Email already exists',
                })
            }
        }

        await sender.update({
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
            updatedBy: userId ?? null,
            updatedOn: new Date(),
        })

        return res.status(200).json({
            message: 'Sender updated successfully',
            data: sender,
        })
    } catch (error: any) {
        console.error('updateSender error:', error)

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        })
    }
}

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
