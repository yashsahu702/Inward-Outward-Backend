
import { sequelize } from '../models'
import { User } from '../models/user.model'
import { Role } from '../models/role.model'
import { UserRole } from '../models/userRole.model'

export const seedMasterData = async () => {
    const transaction = await sequelize.transaction()

    try {
        console.log('Seeding started...')

        // 1. Create roles if they do not already exist
        const roleNames = [
            'DEO',
            'SECTION_OFFICER',
            'HOD',
            'ADMIN',
        ]

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

        console.log(
            'Roles created/found:',
            roles.map((role) => role.roleName)
        )

        // 2. Define users and their respective roles
        const usersData = [
            {
                name: 'User DEO',
                email: 'deo@gmail.com',
                mobileNumber: '9876543210',
                password: '123456',
                roleName: 'DEO',
            },
            {
                name: 'User Section Officer',
                email: 'scofficer@gmail.com',
                mobileNumber: '9876543211',
                password: '123456',
                roleName: 'SECTION_OFFICER',
            },
            {
                name: 'User HOD',
                email: 'hod@gmail.com',
                mobileNumber: '9876543213',
                password: '123456',
                roleName: 'HOD',
            },
            {
                name: 'User Admin',
                email: 'admin@gmail.com',
                mobileNumber: '9876543214',
                password: '123456',
                roleName: 'ADMIN',
            },
        ]

        // 3. Create/reuse users and map each to its role
        for (const u of usersData) {
            const [user] = await User.findOrCreate({
                where: { email: u.email },
                defaults: {
                    name: u.name,
                    email: u.email,
                    mobileNumber: u.mobileNumber,
                    passwordHash: u.password,
                    username: u.email,
                    isVerified: true,
                },
                transaction,
            })

            const role = roles.find(
                (r) => r.roleName === u.roleName
            )

            if (!role) {
                throw new Error(`Role not found: ${u.roleName}`)
            }

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

            console.log(
                `User seeded: ${user.email} -> ${u.roleName}`
            )
        }

        await transaction.commit()
        console.log('Seeding completed successfully!')
    } catch (error) {
        await transaction.rollback()
        console.error('Seeding failed:', error)
        process.exitCode = 1
    }
}

// Run the seed
seedMasterData().catch((error) => {
    console.error('Unexpected seeding error:', error)
    process.exitCode = 1
})
