import React from 'react'
import { useAuth } from '../../lib/auth'
import { can, canAccess, MODULE_META, ROLE_LABELS, type ModuleKey, type Perm } from '../../lib/permissions'
import { AccessDenied } from '../ui/PageHeader'

export function Guarded({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const { user } = useAuth()
  const role = user?.role ?? 'OWNER'
  if (!canAccess(role, module)) {
    return <AccessDenied module={MODULE_META[module].label} role={ROLE_LABELS[role]} />
  }
  return <>{children}</>
}

export function usePerm(): { can: (module: ModuleKey, perm?: Perm) => boolean; role: string } {
  const { user } = useAuth()
  const role = user?.role ?? 'OWNER'
  return {
    can: (module, perm = 'view') => can(role, module, perm),
    role: ROLE_LABELS[role],
  }
}
