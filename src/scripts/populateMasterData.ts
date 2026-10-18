import { sequelize } from '../models' // ✅ change path if needed

import { User } from '../models/user.model'
import { Role } from '../models/role.model'
import { Department } from '../models/department.model'
import { UserRole } from '../models/userRole.model'


export const seedMasterData = async () => {
    const transaction = await sequelize.transaction()

    try {
        console.log('✅ Seeding started...')

        // 1) Insert Roles
        const roleNames = ['DEO', 'SECTION_OFFICER', 'HOD', 'ADMIN']

        const roles = await Promise.all(
            roleNames.map(async (roleName) => {
                const [role] = await Role.findOrCreate({
                    where: { roleName },
                    defaults: { roleName },
                    transaction,
                })
                return role
            })
        )

        console.log('✅ Roles inserted:', roles.map((r) => r.roleName))

        // // 2) Insert Departments
        // const departmentsData = [
        //     { departmentName: 'JDRDept', departmentCode: 'JDR' },
        // ]

        // const departments = await Promise.all(
        //     departmentsData.map(async (d) => {
        //         const [dept] = await Department.findOrCreate({
        //             where: { departmentCode: d.departmentCode },
        //             defaults: {
        //                 departmentName: d.departmentName,
        //                 departmentCode: d.departmentCode,
        //                 activeFlag: true,
        //             },
        //             transaction,
        //         })
        //         return dept
        //     })
        // )

        // console.log('✅ Departments inserted:', departments.map((d) => d.departmentName))

        // 3) Create 4 Users (each user has 1 unique role + both departments)
        const usersData = [
            {
                name: 'User DEO',
                email: 'deo@gmail.com',
                mobileNumber: '9876543210',
                password: '123456',
                username: 'deo@gmail.com',
                roleName: 'DEO',
            },
            {
                name: 'User Clerk',
                email: 'scofficer@gmail.com',
                mobileNumber: '9876543211',
                password: '123456',
                username: 'scofficer@gmail.com',
                roleName: 'SECTION_OFFICER',
            },
            {
                name: 'User HOD',
                email: 'hod@gmail.com',
                mobileNumber: '9876543213',
                password: '123456',
                username: 'hod@gmail.com',
                roleName: 'HOD',
            },
             {
                name: 'User Admin',
                email: 'admin@gmail.com',
                mobileNumber: '9876543213',
                password: '123456',
                username: 'admin@gmail.com',
                roleName: 'ADMIN',
            },
        ]

        for (const u of usersData) {
            // create user if not exists
            const [user] = await User.findOrCreate({
                where: { email: u.email },
                defaults: {
                    name: u.name,
                    email: u.email,
                    mobileNumber: u.mobileNumber,
                    passwordHash: u.password, // ✅ hook will hash
                    username: u.username,
                    isVerified: true,
                },
                transaction,
            })

            // assign role
            const role = roles.find((r) => r.roleName === u.roleName)
            if (!role) throw new Error(`Role not found: ${u.roleName}`)

            await UserRole.findOrCreate({
                where: {
                    userId: user.id,
                    roleId: role.roleId,
                },
                defaults: {
                    userId: user.id,
                    roleId: role.roleId,
                },
                transaction,
            })

            // assign both departments
            // for (const dept of departments) {
            //     await UserDepartment.findOrCreate({
            //         where: {
            //             userId: user.id,
            //             departmentId: dept.id,
            //         },
            //         defaults: {
            //             userId: user.id,
            //             departmentId: dept.id,
            //             activeFlag: true,
            //         },
            //         transaction,
            //     })
            // }

            console.log(`✅ User seeded: ${user.email} -> Role: ${u.roleName} + Both Departments`)
        }

        await transaction.commit()
        console.log('✅ Seeding completed successfully!')
        process.exit(0)
    } catch (error) {
        await transaction.rollback()
        console.error('❌ Seeding failed:', error)
        process.exit(1)
    }
}

// run
seedMasterData()
