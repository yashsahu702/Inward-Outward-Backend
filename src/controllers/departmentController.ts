import { Request, Response } from 'express'
import { Department } from '../models/department.model'
import { AuthRequest } from '../types/auth.types'
import { sequelize, Audit} from '../models';
import { EntityType } from '../models/enums';
import { Transaction, Op } from 'sequelize';


export const createDepartment = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const { departmentName, departmentCode, activeFlag } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!departmentName || !departmentCode) {
            return res.status(400).json({
                message: 'Department name and department code are required',
            });
        }

        const existingDepartment = await Department.findOne({
            where: { departmentCode },
        });

        if (existingDepartment) {
            return res.status(400).json({
                message: 'Department code already exists',
            });
        }

        transaction = await sequelize.transaction();

        const department = await Department.create(
            {
                departmentName,
                departmentCode,
                activeFlag: activeFlag ?? true,
                createdBy: userId,
                createdOn: new Date(),
            },
            { transaction }
        );

        await Audit.create(
            {
                entity: EntityType.DEPARTMENT,
                entityId: department.id,
                action: 'Create',
                performedBy: userId,
                remarks: `Department "${department.departmentName}" created successfully`,
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
            message: 'Department created successfully',
            data: department,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Transaction rollback error:', rollbackError);
            }
        }

        console.error('createDepartment error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
    let transaction: Transaction | undefined;

    try {
        const { id, departmentName, departmentCode, activeFlag } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'User authentication is required',
            });
        }

        if (!id) {
            return res.status(400).json({
                message: 'Department ID is required',
            });
        }

        const department = await Department.findByPk(id);

        if (!department) {
            return res.status(404).json({
                message: 'Department not found',
            });
        }

        if (
            departmentCode &&
            departmentCode !== department.departmentCode
        ) {
            const existingDepartment = await Department.findOne({
                where: {
                    departmentCode,
                    id: { [Op.ne]: id },
                },
            });

            if (existingDepartment) {
                return res.status(400).json({
                    message: 'Department code already exists',
                });
            }
        }

        const previousDepartment = department.toJSON();

        transaction = await sequelize.transaction();

        await department.update(
            {
                departmentName: departmentName ?? department.departmentName,
                departmentCode: departmentCode ?? department.departmentCode,
                activeFlag: activeFlag ?? department.activeFlag,
                updatedBy: userId,
                updatedOn: new Date(),
            },
            { transaction }
        );

        await Audit.create(
            {
                entity: EntityType.DEPARTMENT,
                entityId: department.id,
                action: 'Update',
                performedBy: userId,
                remarks: `Department "${department.departmentName}" updated. Previous values: ${JSON.stringify(previousDepartment)}`,
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
            message: 'Department updated successfully',
            data: department,
        });
    } catch (error: any) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Transaction rollback error:', rollbackError);
            }
        }

        console.error('updateDepartment error:', error);

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};


export const getDepartments = async (req: AuthRequest, res: Response) => {
    try {


        const departments = await Department.findAll({

            order: [['departmentName', 'ASC']],
        })

        return res.status(200).json({
            message: 'Departments fetched successfully',
            data: departments,
        })
    } catch (error: any) {
        console.error('getDepartments error:', error)
        return res.status(500).json({
            message: 'Failed to fetch departments',
            error: error?.message || error,
        })
    }
}


export const getDepartmentById = async (req: AuthRequest, res: Response) => {
    try {

        const { id } = req.params;
        const department = await Department.findOne({
            where: { id: id },

        })

        return res.status(200).json({
            message: 'Department fetched successfully',
            data: department,
        })
    } catch (error: any) {
        console.error('getDepartments error:', error)
        return res.status(500).json({
            message: 'Failed to fetch departments',
            error: error?.message || error,
        })
    }
}


