
import {
    sequelize,
    User,
    Sender,
    Subject,
    Branch,
    Section,
    UserSection,
} from '../models';

import { Transaction } from 'sequelize';

const seedGovernmentData = async (): Promise<void> => {
    let transaction: Transaction | undefined;

    try {
        await sequelize.authenticate();

        transaction = await sequelize.transaction();

        console.log('Starting government data seeding...');

        // --------------------------------------------------
        // 1. GET EXISTING USERS
        // --------------------------------------------------

        const users = await User.findAll({
            attributes: ['id'],
            transaction,
        });

        if (users.length === 0) {
            throw new Error(
                'No users found. Create at least one user before running this seed.'
            );
        }

        // Use an existing user for mandatory createdBy fields.
        const createdBy = users[0].id;

        // --------------------------------------------------
        // 2. CREATE TWO GOVERNMENT SENDERS
        // --------------------------------------------------

        const senderData = [
            {
                senderName: 'Public Works Department',
                senderType: 'Government',
                organization: 'Government of Maharashtra',
                designation: 'Executive Engineer',
                address: 'Mantralaya, Mumbai, Maharashtra',
                district: 'Mumbai',
                taluka: 'Mumbai',
                pinCode: '400032',
                mobile: '9876500001',
                email: 'pwd@example.com',
            },
            {
                senderName: 'CIDCO',
                senderType: 'Government',
                organization:
                    'City and Industrial Development Corporation',
                designation: 'Deputy Engineer',
                address: 'CIDCO Bhavan, CBD Belapur, Navi Mumbai',
                district: 'Thane',
                taluka: 'Belapur',
                pinCode: '400614',
                mobile: '9876500002',
                email: 'cidco@example.com',
            },
        ];

        const senders: Sender[] = [];

        for (const data of senderData) {
            const [sender] = await Sender.findOrCreate({
                where: {
                    senderName: data.senderName,
                },
                defaults: {
                    ...data,
                    activeFlag: true,
                    createdBy,
                    createdOn: new Date(),
                },
                transaction,
            });

            // Keep existing sender records active for this seed.
            if (!sender.activeFlag) {
                await sender.update(
                    { activeFlag: true },
                    { transaction }
                );
            }

            senders.push(sender);
        }

        console.log('2 government senders created/found.');

        // --------------------------------------------------
        // 3. CREATE FOUR SUBJECTS
        //    Two subjects per sender
        // --------------------------------------------------

        const subjectData = [
            {
                subjectName: 'Road Construction Proposal',
                subjectCode: 'GOV-SUB-001',
                senderIndex: 0,
            },
            {
                subjectName: 'Building Repair Request',
                subjectCode: 'GOV-SUB-002',
                senderIndex: 0,
            },
            {
                subjectName: 'Land Development Proposal',
                subjectCode: 'GOV-SUB-003',
                senderIndex: 1,
            },
            {
                subjectName: 'Infrastructure Development Request',
                subjectCode: 'GOV-SUB-004',
                senderIndex: 1,
            },
        ];

        for (const data of subjectData) {
            const sender = senders[data.senderIndex];

            const [subject] = await Subject.findOrCreate({
                where: {
                    subjectCode: data.subjectCode,
                },
                defaults: {
                    subjectName: data.subjectName,
                    subjectCode: data.subjectCode,
                    senderId: sender.id,
                    activeFlag: true,
                    createdBy,
                    createdOn: new Date(),
                },
                transaction,
            });

            // Ensure the intended sender mapping.
            if (subject.senderId !== sender.id) {
                await subject.update(
                    {
                        senderId: sender.id,
                        subjectName: data.subjectName,
                        activeFlag: true,
                    },
                    { transaction }
                );
            }
        }

        console.log('4 subjects created/found.');

        // --------------------------------------------------
        // 4. CREATE FOUR BRANCHES
        //    Two branches per sender
        // --------------------------------------------------

        const branchData = [
            {
                branchName: 'Road Development Branch',
                branchCode: 'GOV-BR-001',
                senderIndex: 0,
            },
            {
                branchName: 'Building Maintenance Branch',
                branchCode: 'GOV-BR-002',
                senderIndex: 0,
            },
            {
                branchName: 'Land Development Branch',
                branchCode: 'GOV-BR-003',
                senderIndex: 1,
            },
            {
                branchName: 'Infrastructure Planning Branch',
                branchCode: 'GOV-BR-004',
                senderIndex: 1,
            },
        ];

        for (const data of branchData) {
            const sender = senders[data.senderIndex];

            const [branch] = await Branch.findOrCreate({
                where: {
                    senderId: sender.id,
                    branchCode: data.branchCode,
                },
                defaults: {
                    branchName: data.branchName,
                    branchCode: data.branchCode,
                    senderId: sender.id,
                    activeFlag: true,
                    createdBy,
                    createdOn: new Date(),
                },
                transaction,
            });

            if (!branch.activeFlag) {
                await branch.update(
                    { activeFlag: true },
                    { transaction }
                );
            }
        }

        console.log('4 branches created/found.');

        // --------------------------------------------------
        // 5. CREATE TWO SECTIONS
        // --------------------------------------------------

        const sectionData = [
            {
                sectionName: 'Finance Section',
                sectionCode: 'SEC-FINANCE-001',
            },
            {
                sectionName: 'Building Maintenance Section',
                sectionCode: 'SEC-BUILDING-001',
            },
        ];

        const sections: Section[] = [];

        for (const data of sectionData) {
            const [section] = await Section.findOrCreate({
                where: {
                    sectionCode: data.sectionCode,
                },
                defaults: {
                    sectionName: data.sectionName,
                    sectionCode: data.sectionCode,
                    activeFlag: true,
                    createdBy,
                    createdOn: new Date(),
                },
                transaction,
            });

            if (!section.activeFlag) {
                await section.update(
                    { activeFlag: true },
                    { transaction }
                );
            }

            sections.push(section);
        }

        console.log('2 sections created/found.');

        // --------------------------------------------------
        // 6. MAP EVERY EXISTING USER TO BOTH SECTIONS
        // --------------------------------------------------

        let mappingsCreated = 0;

        for (const user of users) {
            for (const section of sections) {
                const [, created] = await UserSection.findOrCreate({
                    where: {
                        userId: user.id,
                        sectionId: section.id,
                    },
                    defaults: {
                        userId: user.id,
                        sectionId: section.id,
                        createdBy,
                        createdOn: new Date(),
                    },
                    transaction,
                });

                if (created) {
                    mappingsCreated++;
                }
            }
        }

        console.log(
            `Processed ${users.length} users and ${sections.length} sections.`
        );

        console.log(
            `${mappingsCreated} new user-section mappings created.`
        );

        // --------------------------------------------------
        // 7. COMMIT TRANSACTION
        // --------------------------------------------------

        await transaction.commit();
        transaction = undefined;

        console.log('Government seed data completed successfully.');
        console.log({
            senders: senders.length,
            subjects: subjectData.length,
            branches: branchData.length,
            sections: sections.length,
            users: users.length,
            newUserSectionMappings: mappingsCreated,
        });
    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    'Transaction rollback failed:',
                    rollbackError
                );
            }
        }

        console.error('Government seed failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
};

seedGovernmentData()
    .then(() => {
        process.exitCode = 0;
    })
    .catch(() => {
        process.exitCode = 1;
    });
