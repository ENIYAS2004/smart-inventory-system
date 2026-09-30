import { Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const users = await User.find().select('-password').populate('department', 'name code').sort({ name: 1 });
    return res.status(200).json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, role, department, departmentName, designation, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'STAFF',
      department: department || null,
      departmentName: departmentName || '',
      designation: designation || 'Staff Member',
      phone: phone || '',
    });

    await newUser.save();

    await logAudit({
      user: req.user,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: newUser._id.toString(),
      details: `${req.user?.name} created user account for ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
      ipAddress: req.ip,
    });

    const userObj = newUser.toObject();
    delete (userObj as any).password;

    return res.status(201).json({ success: true, user: userObj });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, role, department, departmentName, designation, phone, isActive, password } = req.body;

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (department !== undefined) user.department = department || null;
    if (departmentName) user.departmentName = departmentName;
    if (designation) user.designation = designation;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // pre-save will hash

    await user.save();

    await logAudit({
      user: req.user,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: `${req.user?.name} updated profile for ${user.name}`,
      ipAddress: req.ip,
    });

    const userObj = user.toObject();
    delete (userObj as any).password;

    return res.status(200).json({ success: true, user: userObj });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    if (req.params.id === req.user?._id?.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAudit({
      user: req.user,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: req.params.id,
      details: `${req.user?.name} deleted user ${user.name} (${user.email})`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: 'User removed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
