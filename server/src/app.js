import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: '🏞️ Trailverse Data Viewer',
    endpoints: {
      users: '/users',
      parks: '/parks'
    }
  });
});

app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/parks', async (req, res) => {
  try {
    const parks = await prisma.park.findMany();
    res.json({ success: true, count: parks.length, data: parks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log('🚀 Server running on http://localhost:5001');
});
