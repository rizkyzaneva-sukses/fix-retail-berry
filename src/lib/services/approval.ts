import { prisma } from '@/lib/prisma'

/**
 * Check if a role can approve within a given module.
 */
export async function canApprove(
  role: string,
  module: string
): Promise<boolean> {
  const permission = await prisma.permission.findUnique({
    where: {
      role_module: {
        role: role as any,
        module,
      },
    },
  })

  return permission?.canApprove ?? false
}

/**
 * Create a change request or set status directly based on permissions.
 */
export async function createApproval(params: {
  entityType: string
  entityId: number
  requestType: string
  payload?: any
  reason: string
  requestedById: number
  requestedByName: string
  requesterRole: string
  module: string
}) {
  const {
    entityType,
    entityId,
    requestType,
    payload,
    reason,
    requestedById,
    requestedByName,
    requesterRole,
    module,
  } = params

  const canAutoApprove = await canApprove(requesterRole, module)

  if (canAutoApprove) {
    return {
      status: 'approved' as const,
      changeRequest: null,
    }
  }

  const changeRequest = await prisma.changeRequest.create({
    data: {
      entityType,
      entityId,
      requestType,
      payload: payload ?? undefined,
      reason,
      requestedById,
      requestedByName,
      status: 'pending',
    },
  })

  return {
    status: 'pending' as const,
    changeRequest,
  }
}
