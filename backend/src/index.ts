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
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

console.log('--- Startup Debug ---');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('__dirname:', __dirname);

// Health check
app.get('/health', (req, res) => {
  res.send('Server is running');
});

// Database check
async function checkDb() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
checkDb();

app.use(cors());
app.use(express.json());

// --- Middlewares ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req: any, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Project Routes ---
app.post('/api/projects', authenticateToken, async (req: any, res) => {
  const { name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN' // Creator is Admin
          }
        }
      }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects', authenticateToken, async (req: any, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user.id } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { tasks: true } }
      }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        members: { some: { userId: req.user.id } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: { assignee: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Check if current user is admin
    const isCurrentUserAdmin = project.members.some(m => m.userId === req.user.id && m.role === 'ADMIN');
    res.json({ ...project, isCurrentUserAdmin });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/projects/:id/members', authenticateToken, async (req: any, res) => {
  const { email, role } = req.body; // role can be ADMIN or MEMBER
  const projectId = req.params.id;

  try {
    // Check if current user is admin
    const currentUserMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });

    if (!currentUserMember || currentUserMember.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role: role || 'MEMBER'
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json(member);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'User is already a member' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/projects/:id/members/:userId', authenticateToken, async (req: any, res) => {
  const projectId = req.params.id;
  const userIdToRemove = req.params.userId;

  try {
    const currentUserMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });

    if (!currentUserMember || currentUserMember.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: userIdToRemove } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Task Routes ---
app.post('/api/projects/:projectId/tasks', authenticateToken, async (req: any, res) => {
  const { title, description, dueDate, assigneeId } = req.body;
  const projectId = req.params.projectId;

  try {
    const currentUserMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });

    if (!currentUserMember || currentUserMember.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create tasks' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null
      },
      include: { assignee: { select: { id: true, name: true } } }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req: any, res) => {
  const { title, description, status, dueDate, assigneeId } = req.body;
  const taskId = req.params.id;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: { include: { members: true } } } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const currentUserMember = task.project.members.find(m => m.userId === req.user.id);
    if (!currentUserMember) return res.status(403).json({ error: 'Not a member of this project' });

    // Members can only update status if they are the assignee or just any member? Let's say any member can update status, but only admins can update details.
    if (currentUserMember.role !== 'ADMIN') {
       // Member updating
       if (title !== undefined || description !== undefined || dueDate !== undefined || assigneeId !== undefined) {
         return res.status(403).json({ error: 'Only admins can edit task details' });
       }
    }

    const updateData: any = { status };
    if (currentUserMember.role === 'ADMIN') {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { assignee: { select: { id: true, name: true } } }
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Dashboard Stats ---
app.get('/api/dashboard', authenticateToken, async (req: any, res) => {
  try {
    // Tasks assigned to me
    const myTasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: { project: { select: { name: true } } }
    });

    const todoCount = myTasks.filter(t => t.status === 'TODO').length;
    const inProgressCount = myTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const doneCount = myTasks.filter(t => t.status === 'DONE').length;

    const overdueCount = myTasks.filter(t => 
      t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    res.json({
      todoCount,
      inProgressCount,
      doneCount,
      overdueCount,
      recentTasks: myTasks.slice(0, 5) // Last 5 tasks
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const staticPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(staticPath)) {
  console.log('Production mode detected: Serving static files from:', staticPath);
  app.use(express.static(staticPath));
  app.use((req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
  });
} else {
  console.log('Development mode detected: Frontend dist not found at', staticPath);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
