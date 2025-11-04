import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { ApiResponse, LoginRequest, RegisterRequest, User } from '../types';
import { trackActivity, trackFailedLogin } from '../middleware/tracking';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, username, password, firstName, lastName } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User with this email or username already exists'
      };
      res.status(400).json(response);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log successful registration for debugging
    console.log(`[POST /auth/register] User registered successfully: ${user.email} (ID: ${user.id})`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Track registration activity
    await trackActivity(user.id, 'register', 'user', user.id, { email, username }, req);

    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: user as User,
        token
      },
      message: 'User registered successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0].message
      };
      res.status(400).json(response);
      return;
    }

    console.error('Registration error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Registration failed'
    };
    res.status(500).json(response);
    return;
  }
});

// Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      // Track failed login attempt
      await trackFailedLogin(email, req.ip || 'unknown', req);
      
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials'
      };
      res.status(401).json(response);
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Track failed login attempt
      await trackFailedLogin(email, req.ip || 'unknown', req);
      
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials'
      };
      res.status(401).json(response);
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Track successful login
    await trackActivity(user.id, 'login', 'user', user.id, { email }, req);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: {
        user: userWithoutPassword as User,
        token
      },
      message: 'Login successful'
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0].message
      };
      res.status(400).json(response);
      return;
    }

    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Login failed'
    };
    res.status(500).json(response);
    return;
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Access token required'
      };
      res.status(401).json(response);
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ user: User }> = {
      success: true,
      data: { user: user as User }
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid token'
    };
    res.status(403).json(response);
    return;
  }
});

// Logout (client-side token removal)
router.post('/logout', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Logout successful'
  };
  res.json(response);
});

export default router;
