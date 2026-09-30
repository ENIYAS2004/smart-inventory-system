import { Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { action, entity, search, page = 1, limit = 25 } = req.query;
    const query: any = {};

    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ details: searchRegex }, { userName: searchRegex }, { entityId: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * pageSize;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
