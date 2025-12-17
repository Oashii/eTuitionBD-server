# eTuitionBD Server - Backend API

Express.js RESTful API server for the eTuitionBD tuition management platform. Handles authentication, CRUD operations, payment tracking, and admin management.

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- MongoDB (local or cloud instance)
- Firebase service account credentials

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the server directory:

```
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/etuitionbd

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Firebase (Optional - for service account)
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_key_here

# Server
PORT=5000
NODE_ENV=development
```

### Running the Server

```bash
npm start
# Server runs on http://localhost:5000
```

## 📡 API Endpoints (40+)

### Authentication Routes

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Email/password login
POST   /api/auth/google-login      # Google authentication
GET    /api/auth/current-user      # Get current user
```

### Tuition Routes

```
POST   /api/tuitions               # Create new tuition
GET    /api/tuitions               # List tuitions (with pagination, filters)
GET    /api/tuitions/:id           # Get tuition details
PUT    /api/tuitions/:id           # Update tuition
DELETE /api/tuitions/:id           # Delete tuition
GET    /api/my-tuitions            # User's posted tuitions
GET    /api/tuitions/latest/home   # Latest tuitions for homepage
GET    /api/tutors/latest          # Latest tutors for homepage
```

**Query Parameters for List:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `subject` - Filter by subject
- `location` - Filter by location
- `class` - Filter by class
- `sortBy` - Sort field (createdAt, budget)
- `sortOrder` - asc or desc

### Application Routes

```
POST   /api/applications           # Apply to tuition
GET    /api/applications           # List applications
GET    /api/applications/:id       # Get application details
PATCH  /api/applications/:id       # Update application status
DELETE /api/applications/:id       # Delete application
GET    /api/my-applications        # User's applications
```

### Payment Routes

```
POST   /api/payments               # Record payment transaction
GET    /api/payments               # Payment history
GET    /api/payments/revenue       # Revenue history (Tutor)
```

### User Profile Routes

```
GET    /api/profile                # Get user profile
PUT    /api/profile                # Update user profile
GET    /api/tutors                 # List all tutors
GET    /api/tutors/:id             # Get tutor profile
GET    /api/ongoing-tuitions       # User's ongoing tuitions
```

### Admin Routes

```
GET    /api/admin/users            # List all users
PUT    /api/admin/users/:id        # Update user info
DELETE /api/admin/users/:id        # Delete user
PATCH  /api/admin/users/:id/role   # Change user role
GET    /api/admin/tuitions         # List pending tuitions
PATCH  /api/admin/tuitions/:id     # Approve/reject tuition
GET    /api/admin/analytics        # Platform analytics
```

## 📋 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  phone: String,
  role: String (Student/Tutor/Admin),
  profileImage: String (URL),
  bio: String,
  qualifications: String,
  experience: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Tuitions Collection

```javascript
{
  _id: ObjectId,
  subject: String,
  class: String,
  location: String,
  budget: Number,
  schedule: String,
  description: String,
  studentId: ObjectId (ref: Users),
  status: String (Pending/Approved/Rejected),
  createdAt: Date,
  updatedAt: Date
}
```

### Applications Collection

```javascript
{
  _id: ObjectId,
  tuitionId: ObjectId (ref: Tuitions),
  tutorId: ObjectId (ref: Users),
  qualifications: String,
  experience: String,
  expectedSalary: Number,
  status: String (Pending/Approved/Rejected),
  appliedAt: Date,
  approvedAt: Date
}
```

### Payments Collection

```javascript
{
  _id: ObjectId,
  applicationId: ObjectId (ref: Applications),
  studentId: ObjectId (ref: Users),
  tutorId: ObjectId (ref: Users),
  amount: Number,
  transactionId: String,
  status: String (Completed/Pending),
  paymentDate: Date
}
```

## 🔐 Authentication & Security

- **JWT Authentication** - Token-based API authorization
- **Firebase Integration** - User registration & authentication
- **Password Hashing** - bcryptjs for secure password storage
- **CORS Enabled** - Cross-origin requests allowed
- **Role Verification** - Middleware for role-based access
- **Token Expiration** - Configurable token lifetime

### JWT Middleware

```javascript
// Protected routes require valid JWT token
// Token format: Bearer <token>
```

### Admin Verification

```javascript
// Only admins can access /api/admin/* routes
```

## 🛠️ Dependencies

```json
{
  "express": "^5.2.1",
  "mongodb": "^7.0.0",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "firebase-admin": "^12.0.0",
  "axios": "^1.6.0"
}
```

## 📝 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    /* ... */
  },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### List Response with Pagination

```json
{
  "success": true,
  "data": [
    /* ... */
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 12
  }
}
```

## 🧪 Testing Endpoints

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "01700000000",
    "role": "Student"
  }'
```

### Create Tuition

```bash
curl -X POST http://localhost:5000/api/tuitions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Mathematics",
    "class": "10",
    "location": "Dhaka",
    "budget": 5000,
    "schedule": "Evening",
    "description": "Need help with algebra"
  }'
```

### List Tuitions with Filters

```bash
curl http://localhost:5000/api/tuitions?page=1&subject=Math&location=Dhaka
```

## 🐛 Common Issues

### MongoDB Connection Error

- Check MongoDB URI in `.env`
- Verify database is running
- Check network connectivity

### JWT Token Expired

- Regenerate token by re-login
- Extend token expiration time in config

### CORS Errors

- Verify client URL in CORS configuration
- Check request headers

## 📊 Project Statistics

- **Total Routes:** 40+
- **Database Collections:** 4
- **Authentication Methods:** 2 (Email/Google)
- **Lines of Code:** 900+
- **Middleware Functions:** 5

## ✅ Features

- [x] User registration & authentication
- [x] Email/password login
- [x] Google OAuth integration
- [x] JWT token generation & verification
- [x] CRUD operations for tuitions
- [x] Application management
- [x] Payment tracking
- [x] Admin user management
- [x] Tuition moderation (approve/reject)
- [x] Platform analytics
- [x] Search & filter capabilities
- [x] Pagination support
- [x] Role-based access control
- [x] Error handling & validation

## 🔄 Data Flow

1. **User Registration** → Data stored in MongoDB → JWT token generated
2. **Post Tuition** → Status set to "Pending" → Awaiting admin approval
3. **Tutor Application** → Creates application record → Student reviews
4. **Approve Tutor** → Redirect to payment → Transaction recorded
5. **Payment Completion** → Update application status to "Approved"

## 🚀 Deployment Notes

- Configure MongoDB Atlas for cloud database
- Update CORS allowed origins for production
- Store sensitive keys in environment variables
- Set NODE_ENV=production
- Enable HTTPS for secure communication
- Monitor server logs for errors

## 📞 Support

For issues or questions, check:

1. Server logs for error details
2. MongoDB connection status
3. JWT token validity
4. CORS configuration
5. Database schema consistency

---

**Version:** 1.0.0  
**Last Updated:** December 17, 2025  
**Status:** Production Ready (100% Complete)
