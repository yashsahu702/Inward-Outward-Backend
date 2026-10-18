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
  OLD_RECORD = 'Old-Record',
  BUILDING = 'Building',
  DEVELOPER = 'Developer',
  ARCHITECT = 'Architect',
  DOCUMENT = 'Document',
  ROLE = 'Role',
  OBJECTION = 'Objection',
  ASSIGNROLE = 'AssignRole',
  REALATION = 'Relation',
  CREATION = 'Creation',
  SMS_TEMPLATE = 'SmsTemplate',
  IOD = 'IOD',
  BUILDING_CC = 'Building-CC',
  BUILDING_OC = 'Building-OC',
  SURPLUS_AREA = 'Surplus-Area',
  BUILDING_DOC = 'Building-Doc',
  BUILDING_STATUS_PHOTO = 'Building-Status-Photo',
  ZONE = 'Zone',
  NOC = 'Noc',
  USER = 'User',
  WARD = 'Ward',

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
