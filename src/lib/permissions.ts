// Role-based access control
import type { Role } from './types'

export type ModuleKey =
  | 'dashboard' | 'ai' | 'sales' | 'customers' | 'warehouse' | 'purchases' | 'production'
  | 'accounting' | 'finance' | 'debts' | 'hr' | 'reports' | 'analytics' | 'settings' | 'profile' | 'billing'

export type Perm = 'view' | 'create' | 'edit' | 'delete' | 'export'

const ALL: Perm[] = ['view', 'create', 'edit', 'delete', 'export']
const RO: Perm[] = ['view', 'export']
const RW: Perm[] = ['view', 'create', 'edit', 'export']

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Egasi',
  ADMIN: 'Administrator',
  ACCOUNTANT: 'Buxgalter',
  MANAGER: 'Menejer',
  SALES: 'Sotuvchi',
  WAREHOUSE: 'Omborchi',
  HR: 'HR',
  PRODUCTION: 'Ishlab chiqarish',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: 'Tizimga to‘liq kirish: barcha modullar, foydalanuvchilar, xavfsizlik va hisobotlar.',
  ADMIN: 'Tizim boshqaruvi: foydalanuvchilar, rollar, integratsiyalar va sozlamalar.',
  ACCOUNTANT: 'Buxgalteriya, moliya, qarzdorlik va moliyaviy hisobotlar.',
  MANAGER: 'Barcha bo‘limlarni ko‘rish va savdo jarayonlarini boshqarish.',
  SALES: 'Savdo va mijozlar moduli: buyurtmalar, to‘lovlar, mijozlar bazasi.',
  WAREHOUSE: 'Ombor: mahsulotlar, qoldiqlar, inventarizatsiya va xaridlar.',
  HR: 'Xodimlar, ish haqi, davomat va HR hisobotlari.',
  PRODUCTION: 'Ishlab chiqarish: buyruqlar, xomashyo va tannarx hisobi.',
}

// module permissions per role; undefined = no access
export const ROLE_MODULES: Record<Role, Partial<Record<ModuleKey, Perm[]>>> = {
  OWNER: {
    dashboard: ALL, ai: ALL, sales: ALL, customers: ALL, warehouse: ALL, purchases: ALL,
    production: ALL, accounting: ALL, finance: ALL, debts: ALL, hr: ALL, reports: ALL,
    analytics: ALL, settings: ALL, profile: ALL, billing: ALL,
  },
  ADMIN: {
    dashboard: ALL, ai: RO, sales: RO, customers: RW, warehouse: RO, purchases: RO,
    production: RO, accounting: RO, finance: RO, debts: RO, hr: RW, reports: ALL,
    analytics: RO, settings: ALL, profile: ALL, billing: ALL,
  },
  ACCOUNTANT: {
    dashboard: RO, ai: RO, sales: RO, customers: RO, purchases: RO,
    accounting: ALL, finance: ALL, debts: ALL, reports: ALL, analytics: RO,
    profile: ALL, settings: ['view', 'edit'],
  },
  MANAGER: {
    dashboard: ALL, ai: RO, sales: ALL, customers: ALL, warehouse: RO, purchases: RW,
    production: RO, accounting: RO, finance: RO, debts: RO, hr: RO, reports: ALL,
    analytics: RO, profile: ALL, settings: ['view'],
  },
  SALES: {
    dashboard: RO, ai: RO, sales: ALL, customers: ALL, warehouse: ['view'],
    debts: RO, reports: RO, profile: ALL,
  },
  WAREHOUSE: {
    dashboard: RO, ai: RO, warehouse: ALL, purchases: RW, production: RO,
    reports: RO, profile: ALL,
  },
  HR: {
    dashboard: RO, ai: RO, hr: ALL, reports: RO, profile: ALL,
  },
  PRODUCTION: {
    dashboard: RO, ai: RO, production: ALL, warehouse: ['view', 'edit'], purchases: RO,
    reports: RO, profile: ALL,
  },
}

export function can(role: Role, module: ModuleKey, perm: Perm = 'view'): boolean {
  const perms = ROLE_MODULES[role]?.[module]
  return !!perms && perms.includes(perm)
}

export function canAccess(role: Role, module: ModuleKey): boolean {
  return can(role, module, 'view')
}

export const MODULE_META: Record<ModuleKey, { label: string; to: string }> = {
  dashboard: { label: 'Dashboard', to: '/dashboard' },
  ai: { label: 'AI CFO', to: '/ai-cfo' },
  sales: { label: 'Savdo', to: '/sales' },
  customers: { label: 'Mijozlar', to: '/customers' },
  warehouse: { label: 'Ombor', to: '/warehouse' },
  purchases: { label: 'Xaridlar', to: '/purchases' },
  production: { label: 'Ishlab chiqarish', to: '/production' },
  accounting: { label: 'Buxgalteriya', to: '/accounting' },
  finance: { label: 'Moliya', to: '/finance' },
  debts: { label: 'Qarzdorlik', to: '/debts' },
  hr: { label: 'HR', to: '/hr' },
  reports: { label: 'Hisobotlar', to: '/reports' },
  analytics: { label: 'Analitika', to: '/analytics' },
  settings: { label: 'Sozlamalar', to: '/settings' },
  profile: { label: 'Profil', to: '/profile' },
  billing: { label: 'To‘lovlar', to: '/billing' },
}
