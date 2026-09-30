import { AuditLog } from '../models/AuditLog';

interface AuditParams {
  user?: any;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
}

export async function logAudit(params: AuditParams) {
  try {
    await AuditLog.create({
      user: params.user?._id || params.user?.id || null,
      userName: params.user?.name || 'System User',
      userRole: params.user?.role || 'SYSTEM',
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || '',
      details: params.details,
      ipAddress: params.ipAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
