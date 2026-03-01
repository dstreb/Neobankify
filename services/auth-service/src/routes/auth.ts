import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../config/database';
import { producer } from '../config/kafka';
import { logger } from '../config/logger';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_ACCESS_TTL = '15m';
const JWT_REFRESH_TTL = '7d';

// --- Validation Schemas ---
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// --- POST /auth/register ---
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { email, password } = parsed.data;
    const tenantId = req.headers['x-tenant-id'] as string;

    // Check if user already exists
    const existing = await db('users')
      .where({ email, tenant_id: tenantId })
      .first();

    if (existing) {
      res.status(409).json({
        type: 'https://api.neobank.io/errors/conflict',
        title: 'User Already Exists',
        status: 409,
        detail: 'An account with this email already exists for this tenant.',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Create user
    await db('users').insert({
      id: userId,
      tenant_id: tenantId,
      email,
      password_hash: passwordHash,
      kyc_status: 'pending',
      risk_profile: 'moderate',
      goals: JSON.stringify([]),
      preferences: JSON.stringify({
        notificationFrequency: 'daily',
        autoSweepEnabled: false,
        recommendationStyle: 'proactive',
        preferredRedemptionType: 'cashback',
      }),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Publish user created event
    await producer.send({
      topic: 'user.profile.changes',
      messages: [{
        key: userId,
        value: JSON.stringify({
          eventId: uuidv4(),
          eventType: 'user.registered',
          tenantId,
          userId,
          timestamp: new Date().toISOString(),
          version: 1,
          data: { email },
        }),
      }],
    }).catch(err => logger.warn('Failed to publish event', { error: err.message }));

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: userId, tenant_id: tenantId, email, roles: ['user'] },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_TTL }
    );

    const refreshToken = jwt.sign(
      { sub: userId, tenant_id: tenantId, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_TTL }
    );

    logger.info('User registered', { userId, tenantId });

    res.status(201).json({
      success: true,
      data: {
        userId,
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
    });
  } catch (error) {
    logger.error('Registration failed', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Registration Failed',
      status: 500,
      detail: 'An unexpected error occurred during registration.',
    });
  }
});

// --- POST /auth/login ---
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { email, password } = parsed.data;
    const tenantId = req.headers['x-tenant-id'] as string;

    // Find user (only active accounts can log in)
    const user = await db('users')
      .where({ email, tenant_id: tenantId, status: 'active' })
      .first();

    if (!user) {
      res.status(401).json({
        type: 'https://api.neobank.io/errors/unauthorized',
        title: 'Invalid Credentials',
        status: 401,
        detail: 'Invalid email or password.',
      });
      return;
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({
        type: 'https://api.neobank.io/errors/unauthorized',
        title: 'Invalid Credentials',
        status: 401,
        detail: 'Invalid email or password.',
      });
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user.id, tenant_id: tenantId, email, roles: ['user'] },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_TTL }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, tenant_id: tenantId, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_TTL }
    );

    logger.info('User logged in', { userId: user.id, tenantId });

    // Update last login timestamp (auditing / dormant account detection)
    await db('users')
      .where({ id: user.id, tenant_id: tenantId })
      .update({ last_login_at: new Date(), updated_at: new Date() });

    res.json({
      success: true,
      data: {
        userId: user.id,
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    logger.error('Login failed', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Login Failed',
      status: 500,
      detail: 'An unexpected error occurred during login.',
    });
  }
});

// --- POST /auth/refresh ---
authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Missing Refresh Token',
        status: 400,
        detail: 'refreshToken is required.',
      });
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      sub: string;
      tenant_id: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      res.status(401).json({
        type: 'https://api.neobank.io/errors/invalid-token',
        title: 'Invalid Token Type',
        status: 401,
        detail: 'Provided token is not a refresh token.',
      });
      return;
    }

    // Fetch user to get current roles (verify tenant + active status)
    const user = await db('users').where({ id: decoded.sub, tenant_id: decoded.tenant_id, status: 'active' }).first();
    if (!user) {
      res.status(401).json({
        type: 'https://api.neobank.io/errors/unauthorized',
        title: 'User Not Found',
        status: 401,
        detail: 'User associated with this token no longer exists.',
      });
      return;
    }

    // Issue new tokens
    const newAccessToken = jwt.sign(
      { sub: user.id, tenant_id: decoded.tenant_id, email: user.email, roles: ['user'] },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_TTL }
    );

    const newRefreshToken = jwt.sign(
      { sub: user.id, tenant_id: decoded.tenant_id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_TTL }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: (error as Error).message });
    res.status(401).json({
      type: 'https://api.neobank.io/errors/invalid-token',
      title: 'Invalid Refresh Token',
      status: 401,
      detail: 'The refresh token is invalid or expired.',
    });
  }
});

// --- POST /auth/logout ---
authRouter.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  // TODO: Add refresh token to blacklist (Redis)
  res.json({ success: true, data: { message: 'Logged out successfully.' } });
});
