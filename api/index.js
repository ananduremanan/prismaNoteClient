const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();

app.use(cors()); // Enable All CORS Requests
app.use(express.json());

app.post('/notes', async (req, res) => {
  const { title, description } = req.body;
  const note = await prisma.note.create({
    data: {
      title,
      description,
    },
  });
  res.json({ message: 'Note Created', note });
});

app.get('/notes', async (req, res) => {
  res.statusCode = 200;
  const notes = await prisma.note.findMany();
  res.json({ notes });
});

app.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.note.delete({
    where: {
      id,
    },
  });
  res.json({ message: 'Note Deleted' });
});

app.listen(5050, () => console.log('Server is running on port 3000'));