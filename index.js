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

// Save Firebase user profile (no password hashing needed)
app.post('/api/auth/save-profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, role, profileImage } = req.body;

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      // Update existing user profile
      await usersCollection.updateOne(
        { email },
        {
          $set: {
            name: name || existingUser.name,
            phone: phone || existingUser.phone,
            role: role || existingUser.role,
            profileImage: profileImage || existingUser.profileImage,
          },
        }
      );
      
      const updatedUser = await usersCollection.findOne({ email });
      return res.json({
        message: 'User profile updated',
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    }

    // Create new user (Firebase authenticated, no password in DB)
    const newUser = {
      name,
      email,
      role: role || 'Student',
      phone,
      profileImage: profileImage || '',
      status: 'active',
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      message: 'User profile saved successfully',
      user: {
        _id: result.insertedId,
        name,
        email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Save profile error:', error);
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

// Get Tutor's Ongoing Tuitions (Approved tuitions)
app.get('/api/tutor-ongoing-tuitions', verifyToken, async (req, res) => {
  try {
    const approvedApplications = await applicationsCollection
      .find({ tutorId: new ObjectId(req.user.userId), status: 'Approved' })
      .toArray();

    const tuitionIds = approvedApplications.map((app) => app.tuitionId);

    const tuitions = await tuitionsCollection
      .find({ _id: { $in: tuitionIds } })
      .toArray();

    const tutionDetails = tuitions.map((tuition) => {
      const application = approvedApplications.find((app) => app.tuitionId.toString() === tuition._id.toString());
      return { ...tuition, applicationDetails: application };
    });

    res.json({ tuitions: tutionDetails });
  } catch (error) {
    console.error('Get tutor ongoing tuitions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Student's Applied Tutors for a Tuition
app.get('/api/tuitions/:tuitionId/applied-tutors', verifyToken, async (req, res) => {
  try {
    const tuitionId = new ObjectId(req.params.tuitionId);

    const tuition = await tuitionsCollection.findOne({ _id: tuitionId });

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found' });
    }

    if (tuition.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await applicationsCollection
      .find({ tuitionId: tuitionId })
      .toArray();

    res.json({ applications });
  } catch (error) {
    console.error('Get applied tutors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== USER PROFILE ROUTES ====================

// Update User Profile
app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;

    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateData }
    );

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) }, { projection: { password: 0 } });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Tutors Listing (Latest tutors for home page)
app.get('/api/tutors/latest', async (req, res) => {
  try {
    const tutors = await usersCollection
      .find(
        { role: 'Tutor', status: 'active' },
        { projection: { password: 0 } }
      )
      .limit(6)
      .toArray();

    res.json({ tutors });
  } catch (error) {
    console.error('Get latest tutors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Tutors with Pagination
app.get('/api/tutors', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const tutors = await usersCollection
      .find(
        { role: 'Tutor', status: 'active' },
        { projection: { password: 0 } }
      )
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await usersCollection.countDocuments({ role: 'Tutor', status: 'active' });

    res.json({
      tutors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Tutor Profile by ID
app.get('/api/tutors/:id', async (req, res) => {
  try {
    const tutor = await usersCollection.findOne(
      { _id: new ObjectId(req.params.id), role: 'Tutor' },
      { projection: { password: 0 } }
    );

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    res.json({ tutor });
  } catch (error) {
    console.error('Get tutor profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ANALYTICS & REPORTS ROUTES ====================

// Get Platform Analytics (Admin only)
app.get('/api/admin/analytics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await usersCollection.countDocuments();
    const totalStudents = await usersCollection.countDocuments({ role: 'Student' });
    const totalTutors = await usersCollection.countDocuments({ role: 'Tutor' });
    const totalTuitions = await tuitionsCollection.countDocuments();
    const approvedTuitions = await tuitionsCollection.countDocuments({ status: 'Approved' });
    const pendingTuitions = await tuitionsCollection.countDocuments({ status: 'Pending' });
    const rejectedTuitions = await tuitionsCollection.countDocuments({ status: 'Rejected' });

    const payments = await paymentsCollection.find({}).toArray();
    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);

    const applicationStats = {
      pending: await applicationsCollection.countDocuments({ status: 'Pending' }),
      approved: await applicationsCollection.countDocuments({ status: 'Approved' }),
      rejected: await applicationsCollection.countDocuments({ status: 'Rejected' }),
    };

    res.json({
      analytics: {
        users: {
          total: totalUsers,
          students: totalStudents,
          tutors: totalTutors,
          admins: await usersCollection.countDocuments({ role: 'Admin' }),
        },
        tuitions: {
          total: totalTuitions,
          approved: approvedTuitions,
          pending: pendingTuitions,
          rejected: rejectedTuitions,
        },
        applications: applicationStats,
        financial: {
          totalEarnings,
          totalTransactions: payments.length,
        },
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Transaction History (Admin only)
app.get('/api/admin/transactions', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const transactions = await paymentsCollection
      .find({})
      .sort({ transactionDate: -1 })
      .toArray();

    const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);

    res.json({
      transactions,
      summary: {
        totalTransactions: transactions.length,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Get All Users (Admin only)
app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update User (Admin only)
app.put('/api/admin/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const { name, email, role, status, profileImage } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (profileImage) updateData.profileImage = profileImage;

    await usersCollection.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete User (Admin only)
app.delete('/api/admin/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);

    await usersCollection.deleteOne({ _id: userId });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Pending Tuitions (Admin only)
app.get('/api/admin/tuitions/pending', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const tuitions = await tuitionsCollection
      .find({ status: 'Pending' })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ tuitions });
  } catch (error) {
    console.error('Get pending tuitions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Tuitions (Admin only)
app.get('/api/admin/tuitions', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const tuitions = await tuitionsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ tuitions });
  } catch (error) {
    console.error('Get all tuitions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject Tuition (Admin only)
app.patch('/api/admin/tuitions/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const tuitionId = new ObjectId(req.params.id);
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await tuitionsCollection.updateOne(
      { _id: tuitionId },
      { $set: { status, updatedAt: new Date() } }
    );

    res.json({ message: `Tuition ${status.toLowerCase()} successfully`, status });
  } catch (error) {
    console.error('Update tuition status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PAYMENT & TRANSACTION ROUTES ====================

// Record Payment Transaction
app.post('/api/payments', verifyToken, async (req, res) => {
  try {
    const { applicationId, amount, tutorId } = req.body;

    const application = await applicationsCollection.findOne({ _id: new ObjectId(applicationId) });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const payment = {
      applicationId: new ObjectId(applicationId),
      tutorId: new ObjectId(tutorId),
      studentId: new ObjectId(req.user.userId),
      amount: parseFloat(amount),
      status: 'Success',
      transactionDate: new Date(),
      transactionId: `TXN-${Date.now()}`,
    };

    const result = await paymentsCollection.insertOne(payment);

    // Update application status to Approved after payment
    await applicationsCollection.updateOne(
      { _id: new ObjectId(applicationId) },
      { $set: { status: 'Approved', updatedAt: new Date() } }
    );

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: { _id: result.insertedId, ...payment },
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User's Payment History
app.get('/api/my-payments', verifyToken, async (req, res) => {
  try {
    const payments = await paymentsCollection
      .find({ studentId: new ObjectId(req.user.userId) })
      .sort({ transactionDate: -1 })
      .toArray();

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.json({ payments, totalPaid });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Tutor's Revenue History
app.get('/api/tutor-revenue', verifyToken, async (req, res) => {
  try {
    const revenues = await paymentsCollection
      .find({ tutorId: new ObjectId(req.user.userId) })
      .sort({ transactionDate: -1 })
      .toArray();

    const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);

    res.json({ revenues, totalRevenue });
  } catch (error) {
    console.error('Get revenue history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== TUTOR APPLICATION ROUTES ====================

// Create Application (Tutor applies for a tuition)
app.post('/api/applications', verifyToken, async (req, res) => {
  try {
    const { tuitionId, qualifications, experience, expectedSalary } = req.body;

    const tuition = await tuitionsCollection.findOne({ _id: new ObjectId(tuitionId) });

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found' });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

    const newApplication = {
      tuitionId: new ObjectId(tuitionId),
      tutorId: new ObjectId(req.user.userId),
      qualifications,
      experience,
      expectedSalary,
      status: 'Pending',
      tutorName: user.name,
      tutorEmail: user.email,
      tutorProfileImage: user.profileImage || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await applicationsCollection.insertOne(newApplication);

    res.status(201).json({
      message: 'Application submitted successfully',
      application: { _id: result.insertedId, ...newApplication },
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Tutor's Applications
app.get('/api/my-applications', verifyToken, async (req, res) => {
  try {
    const applications = await applicationsCollection
      .find({ tutorId: new ObjectId(req.user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Applications for a Tuition Post (for student)
app.get('/api/tuitions/:tuitionId/applications', verifyToken, async (req, res) => {
  try {
    const tuitionId = new ObjectId(req.params.tuitionId);

    const tuition = await tuitionsCollection.findOne({ _id: tuitionId });

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found' });
    }

    if (tuition.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view applications for this tuition' });
    }

    const applications = await applicationsCollection
      .find({ tuitionId: tuitionId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ applications });
  } catch (error) {
    console.error('Get tuition applications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Application Status
app.patch('/api/applications/:id', verifyToken, async (req, res) => {
  try {
    const applicationId = new ObjectId(req.params.id);
    const { status } = req.body;

    const application = await applicationsCollection.findOne({ _id: applicationId });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const tuition = await tuitionsCollection.findOne({ _id: application.tuitionId });

    if (tuition.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    await applicationsCollection.updateOne(
      { _id: applicationId },
      { $set: { status, updatedAt: new Date() } }
    );

    res.json({ message: 'Application status updated successfully', status });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Application (Tutor can delete their own pending applications)
app.delete('/api/applications/:id', verifyToken, async (req, res) => {
  try {
    const applicationId = new ObjectId(req.params.id);

    const application = await applicationsCollection.findOne({ _id: applicationId });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.tutorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this application' });
    }

    if (application.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot delete non-pending applications' });
    }

    await applicationsCollection.deleteOne({ _id: applicationId });

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== TUITION ROUTES ====================

// Create Tuition Post
app.post('/api/tuitions', verifyToken, async (req, res) => {
  try {
    const { subject, class: className, location, budget, schedule, description } = req.body;

    const newTuition = {
      subject,
      class: className,
      location,
      budget,
      schedule,
      description,
      postedBy: new ObjectId(req.user.userId),
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tuitionsCollection.insertOne(newTuition);

    res.status(201).json({
      message: 'Tuition posted successfully',
      tuition: { _id: result.insertedId, ...newTuition },
    });
  } catch (error) {
    console.error('Create tuition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Tuitions with filters, search, sort, and pagination
app.get('/api/tuitions', async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, location, class: className, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    let filter = { status: 'Approved' };

    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (className) filter.class = { $regex: className, $options: 'i' };

    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const tuitions = await tuitionsCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await tuitionsCollection.countDocuments(filter);

    res.json({
      tuitions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tuitions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Latest Tuitions (for home page)
app.get('/api/tuitions/latest/home', async (req, res) => {
  try {
    const tuitions = await tuitionsCollection
      .find({ status: 'Approved' })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.json({ tuitions });
  } catch (error) {
    console.error('Get latest tuitions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Single Tuition by ID
app.get('/api/tuitions/:id', async (req, res) => {
  try {
    const tuition = await tuitionsCollection.findOne({ _id: new ObjectId(req.params.id) });

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found' });
    }

    // Populate posted by user info
    const user = await usersCollection.findOne({ _id: tuition.postedBy }, { projection: { name: 1, profileImage: 1 } });

    res.json({ tuition: { ...tuition, postedByUser: user } });
  } catch (error) {
    console.error('Get tuition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User's Tuitions
app.get('/api/my-tuitions', verifyToken, async (req, res) => {
  try {
    const tuitions = await tuitionsCollection
      .find({ postedBy: new ObjectId(req.user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ tuitions });
  } catch (error) {
    console.error('Get user tuitions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Tuition Post
app.put('/api/tuitions/:id', verifyToken, async (req, res) => {
  try {
    const tuitionId = new ObjectId(req.params.id);
    const { subject, class: className, location, budget, schedule, description } = req.body;

    const tuition = await tuitionsCollection.findOne({ _id: tuitionId });

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found' });
    }

    if (tuition.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this tuition' });
    }

    const updateData = {
      subject,
      class: className,
      location,
      budget,
      schedule,
      description,
      updatedAt: new Date(),
    };

    await tuitionsCollection.updateOne({ _id: tuitionId }, { $set: updateData });

    res.json({ message: 'Tuition updated successfully', tuition: { ...tuition, ...updateData } });
  } catch (error) {
    console.error('Update tuition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Tuition Post
app.delete('/api/tuitions/:id', verifyToken, async (req, res) => {
  try {
    const tuitionId = new ObjectId(req.params.id);

    const tuition = await tuitionsCollection.findOne({ _id: tuitionId });

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found' });
    }

    if (tuition.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this tuition' });
    }

    await tuitionsCollection.deleteOne({ _id: tuitionId });

    res.json({ message: 'Tuition deleted successfully' });
  } catch (error) {
    console.error('Delete tuition error:', error);
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