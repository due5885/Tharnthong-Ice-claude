import { RoleLevel, TabType } from '../types';

export const TAB_PERMISSIONS: Record<RoleLevel, TabType[]> = {
  owner: [
    'operations',
    'customers',
    'customerDetails',
    'creditCustomers',
    'warehouse',
    'summary',
    'reconciliation',
    'expenses',
    'assistant',
    'attendance',
    'vehicles',
  ],
  accountant: [
    'operations',
    'customers',
    'customerDetails',
    'creditCustomers',
    'warehouse',
    'reconciliation',
    'expenses',
    'assistant',
    'attendance',
    'vehicles',
  ],
  staff: ['operations', 'warehouse'],
};

export function canAccessTab(roleLevel: RoleLevel, tab: TabType): boolean {
  return TAB_PERMISSIONS[roleLevel].includes(tab);
}

export function canManageAdmins(roleLevel: RoleLevel): boolean {
  return roleLevel === 'owner';
}

export function canEditPaymentStatusLabels(roleLevel: RoleLevel): boolean {
  return roleLevel === 'owner' || roleLevel === 'accountant';
}
