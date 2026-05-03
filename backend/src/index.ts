import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();

// ✅ Prisma singleton (prevents connection explosion in serverless)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ✅ ENV validation
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = Number(process.env.PORT) || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Health ---
app.get('/health', (req, res) => {
  return res.status(200).send('Server is running');
});

// --- DB Check (fail fast) ---
(async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  }
})();

// --- Auth Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth Error]', err);
    return res.status(403).json({ error: 'Forbidden' });
  }
};

// ================= AUTH =================

app.post('/api/auth/register', async (req, res) => {
  console.log('➡️ Register API hit');

  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('[Register Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  console.log('➡️ Login API hit');

  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    return res.json(user);
  } catch (error) {
    console.error('[Me Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ================= PROJECTS =================

app.post('/api/projects', authenticateToken, async (req: any, res) => {
  try {
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN',
          },
        },
      },
    });

    return res.json(project);
  } catch (error) {
    console.error('[Create Project Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects', authenticateToken, async (req: any, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user.id } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { tasks: true } },
      },
    });

    return res.json(projects);
  } catch (error) {
    console.error('[Get Projects Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ================= GLOBAL ERROR HANDLER =================

app.use((err: any, req: any, res: any, next: any) => {
  console.error('🔥 Unhandled Error:', err);
  return res.status(500).json({ error: 'Something went wrong' });
});

// ================= STATIC (SAFE) =================

const staticPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));

  app.use('*', (req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
  });
}

// ❌ REMOVE app.listen()

// ✅ EXPORT FOR SERVERLESS
export default app;