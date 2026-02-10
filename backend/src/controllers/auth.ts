import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user AND tenant automatically in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || email.split('@')[0],
        },
      });

      // Auto-create a personal tenant for this user
      const tenant = await tx.tenant.create({
        data: {
          name: `${user.name}'s Workspace`,
        },
      });

      // Create membership (user is owner of their tenant)
      await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });

      return { user, tenant };
    });

    console.log(`✅ Usuario registrado: ${result.user.email} con tenant: ${result.tenant.id}`);

    // Generate token
    const token = jwt.sign(
      { id: result.user.id, email: result.user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
      },
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user with their tenant
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user's primary tenant (first one, or their OWNER tenant)
    const primaryMembership = user.memberships.find((m) => m.role === 'OWNER') || user.memberships[0];

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    console.log(`✅ Login: ${user.email}, Tenant: ${primaryMembership?.tenant.name}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tenant: primaryMembership
        ? {
            id: primaryMembership.tenant.id,
            name: primaryMembership.tenant.name,
          }
        : null,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};
