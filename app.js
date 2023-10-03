const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const dotenv = require("dotenv");

dotenv.config();

app.use(cors()); // Enable All CORS Requests
app.use(express.json());

// Connect to MongoDB
try{
  mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to Mongo");
}catch(error){
  console.error(error);
}

// Define Note schema
const noteSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Note model
const Note = mongoose.model('Note', noteSchema);

app.post('/notes', async (req, res) => {
  const { title, description } = req.body;
  const note = new Note({
    title,
    description
  });
  await note.save();
  res.json({ message: 'Note Created', note });
});

app.get('/notes', async (req, res) => {
  res.statusCode = 200;
  const notes = await Note.find();
  res.json({ notes });
});

app.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  await Note.findByIdAndDelete(id);
  res.json({ message: 'Note Deleted' });
});

app.listen(8080, () => console.log('Server is running on port 8080'));