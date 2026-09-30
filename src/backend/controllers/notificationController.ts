import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userRole = req.user?.role || 'STAFF';

    const notifications = await Notification.find({
      targetRole: { $in: ['ALL', userRole] },
    }).sort({ createdAt: -1 }).limit(50);

    const unreadCount = await Notification.countDocuments({
      targetRole: { $in: ['ALL', userRole] },
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.status(200).json({ success: true, notification });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    const userRole = req.user?.role || 'STAFF';
    await Notification.updateMany(
      { targetRole: { $in: ['ALL', userRole] }, isRead: false },
      { isRead: true }
    );
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
