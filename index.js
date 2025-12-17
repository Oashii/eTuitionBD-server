const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// MongoDB URI
const uri = process.env.DB_URI;

// Create MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database and collections
let db;
let usersCollection;
let tuitionsCollection;
let applicationsCollection;
let paymentsCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('eTuitionBD');
    usersCollection = db.collection('users');
    tuitionsCollection = db.collection('tuitions');
    applicationsCollection = db.collection('applications');
    paymentsCollection = db.collection('payments');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Admin Verification Middleware
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: role || 'Student',
      phone,
      profileImage: '',
      status: 'active',
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertedId, email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: result.insertedId,
        name,
        email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google Login Route
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, profileImage } = req.body;

    let user = await usersCollection.findOne({ email });

    if (!user) {
      const newUser = {
        name,
        email,
        role: 'Student',
        profileImage,
        status: 'active',
        createdAt: new Date(),
      };
      const result = await usersCollection.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Current User
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('eTuitionBD Server is running');
});

// Start server
async function start() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();