// permissionConfig.ts

/**
 * Each key is a unique string (like "DATA_ENTRY_MENU"),
 * and the value is an array of roles that can see or access that menu item.
 */
export const menuPermissions: Record<string, string[]> = {
  DASHBOARD_MENU: [
    'DeputyEng',
    'ExecutiveEng',
    'DeputyChiefEng',
    'ResidentExecEng',
    'Admin',
  ],
  DATA_ENTRY_MENU: ['ExecutiveEng', 'DeputyEng'],
  EDIT_DATA_ENTRY_MENU: [
    'ExecutiveEng',
    'DeputyChiefEng',
    'DeputyEng',
    'Admin',
    // If you want DeputyEng as well, just add it here:
    // 'DeputyEng',
  ],
}
