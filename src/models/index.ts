// src/models/index.ts

import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

// Load ENV
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

// Import model classes
import { User } from './user.model'
import { Role } from './role.model'
import { UserRole } from './userRole.model'

import { Document } from './document.model'
// import { DepartmentUserAccess } from './departmentUserAccess.model'
import { Otp } from './otp.model'
import { Audit } from './audit.model'

import { Department } from './department.model'

//import { RemarkRecord } from './RemarkStatus'

import { NotificationOrdms } from '../models/notificationOrdms.model'
import { Section } from './section.model';
import { UserSection } from './userSection.model';
import { Subject } from './subject.model';
import { Branch } from './branch.model';
import { Sender } from './sender.model';
import { Avak } from './avak.model';
import { RemarkRecord } from './RemarkStatus'
// Create Sequelize instance
export const sequelize = new Sequelize(process.env.PG_URI as string, {
  dialect: 'postgres',
  logging: false,
})

// 1) Initialize models
//Layout.initialize(sequelize)
User.initialize(sequelize)
Role.initialize(sequelize)
UserRole.initialize(sequelize)
Document.initialize(sequelize)
Otp.initialize(sequelize)
Audit.initialize(sequelize)
Department.initialize(sequelize)
Section.initialize(sequelize);
UserSection.initialize(sequelize);
Subject.initialize(sequelize);
Branch.initialize(sequelize);
Sender.initialize(sequelize);
Avak.initialize(sequelize);
RemarkRecord.initialize(sequelize);
//RemarkRecord.initialize(sequelize)
NotificationOrdms.initialize(sequelize)
// 2) Define associations

// ---- Layout → Building


User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });



Role.belongsToMany(User, {
  through: UserRole,
  as: 'users',
  foreignKey: 'roleId',
})
// ---- Roles & bridging
User.hasMany(UserRole, { foreignKey: 'userId', as: 'userRoles' })
UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Role.hasMany(UserRole, { foreignKey: 'roleId', as: 'userRoles' })
UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })


// UserDepartment.belongsTo(User, {
//   foreignKey: 'userId',
//   as: 'user',
// })

// UserDepartment.belongsTo(Department, {
//   foreignKey: 'departmentId',
//   as: 'department',
// })

// User.belongsToMany(Department, {
//   through: UserDepartment,
//   foreignKey: 'userId',
//   otherKey: 'departmentId',
//   as: 'departments',
// })

// Department.belongsToMany(User, {
//   through: UserDepartment,
//   foreignKey: 'departmentId',
//   otherKey: 'userId',
//   as: 'users',
// })

// Record.hasMany(Document, {
//   foreignKey: 'recordId',
//   as: 'documents',
// })

// Record belongsTo Department
// Record.belongsTo(Department, {
//   foreignKey: 'departmentId',
//   as: 'department',
// })

// Record belongsTo User (createdBy)
// Record.belongsTo(User, {
//   foreignKey: 'createdBy',
//   as: 'creator',
// })

// Document.belongsTo(Record, {
//   foreignKey: 'recordId',
//   as: 'record',
// })

// Department.hasMany(Record, {
//   foreignKey: 'departmentId',
//   as: 'records',
// })
// User.hasMany(Record, {
//   foreignKey: 'createdBy',
//   as: 'records',
// })

// RemarkRecord.belongsTo(Record, {
//   foreignKey: 'recordId',
//   as: 'record',
// })

// RemarkRecord.belongsTo(User, {
//   foreignKey: 'userId',
//   as: 'user',
// })
// Record.hasMany(RemarkRecord, {
//   foreignKey: 'recordId',
//   as: 'remarks',
//   onDelete: 'CASCADE',
// })
// Record.belongsTo(User, {
//   foreignKey: 'userId',
//   as: 'user',
// })
// Record.belongsTo(User, {
//   foreignKey: 'actionBy',
//   as: 'actionUser',
// })


// ---- OTP
// User.hasMany(Otp, {
//   foreignKey: 'identifier',
//   sourceKey: 'identifier',
//   as: 'otps',
// })
// Otp.belongsTo(User, {
//   foreignKey: 'identifier',
//   targetKey: 'identifier',
//   as: 'user',
// })

// ---- Audit
User.hasMany(Audit, { foreignKey: 'userId', as: 'audits' })
Audit.belongsTo(User, { foreignKey: 'userId', as: 'user' })

// Associate BuildingApproval with Building:

User.hasMany(Otp, {
  foreignKey: 'userId',
  as: 'otps',
})
Otp.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
})

// ==========================================
// User <-> Section (Many-to-Many)
// ==========================================

User.belongsToMany(Section, {
    through: UserSection,
    foreignKey: 'userId',
    otherKey: 'sectionId',
    as: 'sections',
});

Section.belongsToMany(User, {
    through: UserSection,
    foreignKey: 'sectionId',
    otherKey: 'userId',
    as: 'users',
});

// Junction-table associations
User.hasMany(UserSection, {
    foreignKey: 'userId',
    as: 'userSections',
});

UserSection.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Section.hasMany(UserSection, {
    foreignKey: 'sectionId',
    as: 'userSections',
});

UserSection.belongsTo(Section, {
    foreignKey: 'sectionId',
    as: 'section',
});

// ==========================================
// Department -> Subject (One-to-Many)
// ==========================================

Department.hasMany(Subject, {
    foreignKey: 'departmentId',
    as: 'subjects',
});

Subject.belongsTo(Department, {
    foreignKey: 'departmentId',
    as: 'department',
});

// ==========================================
// Department -> Branch (One-to-Many)
// ==========================================

Department.hasMany(Branch, {
    foreignKey: 'departmentId',
    as: 'branches',
});

Branch.belongsTo(Department, {
    foreignKey: 'departmentId',
    as: 'department',
});

// ==========================================
// Avak -> Sender (Many-to-One)
// ==========================================

Avak.belongsTo(Sender, {
    foreignKey: 'senderId',
    as: 'sender',
});

Sender.hasMany(Avak, {
    foreignKey: 'senderId',
    as: 'avaks',
});

// ==========================================
// Avak -> Department (Optional)
// ==========================================

Avak.belongsTo(Department, {
    foreignKey: 'departmentId',
    as: 'department',
});

Department.hasMany(Avak, {
    foreignKey: 'departmentId',
    as: 'avaks',
});

// ==========================================
// Avak -> Branch (Optional)
// ==========================================

Avak.belongsTo(Branch, {
    foreignKey: 'branchId',
    as: 'branch',
});

Branch.hasMany(Avak, {
    foreignKey: 'branchId',
    as: 'avaks',
});

// ==========================================
// Avak -> Section (Required)
// ==========================================

Avak.belongsTo(Section, {
    foreignKey: 'markedSectionId',
    as: 'markedSection',
});

Section.hasMany(Avak, {
    foreignKey: 'markedSectionId',
    as: 'markedAvaks',
});

// ==========================================
// Avak -> User (Created By)
// ==========================================

Avak.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
});

User.hasMany(Avak, {
    foreignKey: 'createdBy',
    as: 'createdAvaks',
});

// ==========================================
// Avak -> User (Updated By)
// ==========================================

Avak.belongsTo(User, {
    foreignKey: 'updatedBy',
    as: 'updater',
});

User.hasMany(Avak, {
    foreignKey: 'updatedBy',
    as: 'updatedAvaks',
});

// ==========================================
// Avak -> User (Marked By)
// ==========================================

Avak.belongsTo(User, {
    foreignKey: 'markedBy',
    as: 'marker',
});

User.hasMany(Avak, {
    foreignKey: 'markedBy',
    as: 'markedAvaks',
});

// One Avak has multiple documents
Avak.hasMany(Document, {
    foreignKey: 'avakId',
    as: 'documents',
    onDelete: 'CASCADE',
});

// Each document belongs to one Avak
Document.belongsTo(Avak, {
    foreignKey: 'avakId',
    as: 'avak',
});

// One Avak has many remarks
Avak.hasMany(RemarkRecord, {
    foreignKey: 'avakId',
    as: 'remarks',
    onDelete: 'CASCADE',
});

// Each remark belongs to one Avak
RemarkRecord.belongsTo(Avak, {
    foreignKey: 'avakId',
    as: 'avak',
});

// One user can create multiple remarks
User.hasMany(RemarkRecord, {
    foreignKey: 'userId',
    as: 'remarks',
});

// Each remark belongs to one user
RemarkRecord.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});


console.log('All models initialized & associations set.')

export {
    User,
    Role,
    UserRole,
    Document,
    Otp,
    Audit,
    Department,
RemarkRecord,
    NotificationOrdms,

    Section,
    UserSection,
    Subject,
    Branch,
    Sender,
Avak
};
