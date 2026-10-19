// src/models/enums.ts

export enum DocumentType {
  OLD_RECORD = 'Old-Record',
  NOC = 'Noc',
  BUILDING_DOC = 'Building-Doc',
  BUILDING_PHOTO = 'Building-Photo',
  BUILDING_STATUS_PHOTO = 'Building-Status-Photo',
  IOD = 'IOD',
  BUILDING_CC = 'Building-CC',
  BUILDING_OC = 'Building-OC',
  SURPLUS_AREA = 'Surplus-Area'
}

export enum EntityType {
  // Master Modules
  USER = 'User',
  ROLE = 'Role',
  DEPARTMENT = 'Department',
  BRANCH = 'Branch',
  SECTION = 'Section',
  SUBJECT = 'Subject',
  SENDER = 'Sender',
  USER_SECTION = 'UserSection',

  // Inward / AVAK Module
  AVAK = 'Avak',
  DOCUMENT = 'Document',
  REMARK = 'Remark',

  // Other Modules
  AUDIT = 'Audit',
}

export enum UserType {
  DEVELOPER = 'Developer',
  ARCHITECT = 'Architect',
  PLANNING_DEPARTMENT = 'PlanningDepartment',
}

export enum Actions {
  CREATE_DEV_SKIPPED = 'Creating-Dev-Skipped',
  CREATE_ARCH_SKIPPED = 'Creating-Arch-Skipped',
  DEV_SKIPPED = 'Skipped-Dev-to-Builing-Association',
  ARCH_SKIPPED = 'Skipped-Arch-to-Builder-Association',
  DEV_TO_BUILDING = 'Associate-Dev-to-Building',
  ARCH_TO_DEV = 'Associate-Arch-to-Builder',
  CREATE = 'Create',
  ARCH_TO_BUILDING = 'Associate-Arch-to-Building',
  UPDATE = 'Update',
  DELETE = 'Delete',
}

export enum WorkStatus {
  NOT_STARTED = 'Not-Started',
  IN_PROGRESS = 'In-Progress',
  HELD_UP = 'Held-Up',
  COMPLETED = 'Completed',
  OTHER = 'Other',
}
