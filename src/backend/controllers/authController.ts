import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { logAudit } from '../utils/auditLogger';
import { JWT_SECRET, AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // Flexible auto-seeding / enrollment for personal emails (such as eniyasiva2004@gmail.com or configured ADMIN_EMAIL)
    if (!user) {
      const isConfiguredAdmin =
        normalizedEmail === 'eniyasiva2004@gmail.com' ||
        (process.env.ADMIN_EMAIL && normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase().trim());

      if (isConfiguredAdmin) {
        // Auto-provision personal admin account
        const adminDept = await Department.findOne({ code: 'ADMIN' });
        user = new User({
          name: normalizedEmail === 'eniyasiva2004@gmail.com' ? 'Eniya Siva (Admin)' : 'Administrator',
          email: normalizedEmail,
          password: password || 'password123',
          role: 'ADMIN',
          department: adminDept?._id || null,
          departmentName: 'Administration',
          designation: 'Lead Systems Architect & Administrator',
          phone: '+91 98400 99887',
        });
        await user.save();
        console.log(`Auto-enrolled personal admin user: ${normalizedEmail}`);
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      }
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      user,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      details: `${user.name} (${user.role}) logged in successfully via ${user.email}.`,
      ipAddress: req.ip,
    });

    const userObj = user.toObject();
    delete (userObj as any).password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userObj,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role = 'STAFF', department, designation, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Determine role (custom personal admin emails automatically grant ADMIN)
    const isAdminTarget =
      normalizedEmail === 'eniyasiva2004@gmail.com' ||
      (process.env.ADMIN_EMAIL && normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase().trim()) ||
      role === 'ADMIN';

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: isAdminTarget ? 'ADMIN' : (role || 'STAFF'),
      department: department || null,
      designation: designation || (isAdminTarget ? 'Administrator' : 'Staff Member'),
      phone: phone || '',
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      user: newUser,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: newUser._id.toString(),
      details: `New account registered for ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
      ipAddress: req.ip,
    });

    const userObj = newUser.toObject();
    delete (userObj as any).password;

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: userObj,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    return res.status(200).json({ success: true, user: req.user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Server error retrieving current user.' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  if (req.user) {
    await logAudit({
      user: req.user,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: req.user._id.toString(),
      details: `${req.user.name} logged out.`,
      ipAddress: req.ip,
    });
  }
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}
