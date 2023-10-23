const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();

app.use(cors()); // Enable All CORS Requests
app.use(express.json());

// Connect to MongoDB
try {
  mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to Mongo");
} catch (error) {
  console.error(error);
}

// Define Note schema
const noteSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Define User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


// Create User model
const User = mongoose.model("User", userSchema);

// Create Note model
const Note = mongoose.model("Note", noteSchema);

// SignUp Route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    password: hashedPassword,
  });
  await user.save();
  res.json({ message: "User Created", user });
});

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid password" });
  }
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
  res.json({ token });
});

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, data) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.userId = data.userId;
    next();
  });
};

// Add Note
app.post("/notes", authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  const note = new Note({
    title,
    description,
  });
  await note.save();

  // Find the user and add the note to their notes array
  const user = await User.findById(req.userId);
  user.notes.push(note);
  await user.save();

  res.json({ message: "Note Created", note });
});

// Get Notes
app.get("/notes", authMiddleware, async (req, res) => {
  // Find the user and return their notes
  const user = await User.findById(req.userId).populate("notes");
  res.json({ notes: user.notes });
});

// Delete Note
app.delete("/notes/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  await Note.findByIdAndDelete(id);
  res.json({ message: "Note Deleted" });
});

// Update Note
app.put("/notes/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { newTitle: title, newDescription: description } = req.body;
  await Note.findByIdAndUpdate(id, { title, description });
  res.json({ message: "Note updated successfully" });
});

// Get a single Note
app.get("/notes/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const note = await Note.findById(id);
  res.json({ note });
});

app.listen(8080, () => console.log("Running on port 8080"));
