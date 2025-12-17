# eTuitionBD Server API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Routes

### Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Student",
  "phone": "01234567890"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Student"
  }
}
```

### Login User
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Student",
    "profileImage": ""
  }
}
```

### Google Login
**POST** `/api/auth/google`

**Request Body:**
```json
{
  "email": "john@gmail.com",
  "name": "John Doe",
  "profileImage": "image_url"
}
```

**Response:** `200 OK`
```json
{
  "message": "Google login successful",
  "token": "jwt_token",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "Student",
    "profileImage": "image_url"
  }
}
```

### Get Current User
**GET** `/api/auth/me` *(Protected)*

**Response:** `200 OK`
```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Student",
    "phone": "01234567890",
    "profileImage": ""
  }
}
```

---

## 2. Tuition Routes

### Create Tuition Post
**POST** `/api/tuitions` *(Protected)*

**Request Body:**
```json
{
  "subject": "Mathematics",
  "class": "Class 10",
  "location": "Dhaka",
  "budget": "5000",
  "schedule": "2 days/week",
  "description": "Need help with algebra and geometry"
}
```

**Response:** `201 Created`

### Get All Tuitions with Filters
**GET** `/api/tuitions?page=1&limit=10&subject=Math&location=Dhaka&class=Class10&sortBy=createdAt&order=desc`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `subject` (search)
- `location` (filter)
- `class` (filter)
- `sortBy` (default: createdAt)
- `order` (asc or desc)

**Response:** `200 OK`
```json
{
  "tuitions": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Get Latest Tuitions (Home Page)
**GET** `/api/tuitions/latest/home`

**Response:** `200 OK`
```json
{
  "tuitions": [...]
}
```

### Get Single Tuition
**GET** `/api/tuitions/:id`

**Response:** `200 OK`

### Get User's Tuitions
**GET** `/api/my-tuitions` *(Protected)*

**Response:** `200 OK`

### Update Tuition
**PUT** `/api/tuitions/:id` *(Protected)*

**Request Body:** Same as create

**Response:** `200 OK`

### Delete Tuition
**DELETE** `/api/tuitions/:id` *(Protected)*

**Response:** `200 OK`

---

## 3. Tutor Application Routes

### Create Application
**POST** `/api/applications` *(Protected)*

**Request Body:**
```json
{
  "tuitionId": "tuition_id",
  "qualifications": "Bachelor's degree",
  "experience": "5 years",
  "expectedSalary": "5000"
}
```

**Response:** `201 Created`

### Get Tutor's Applications
**GET** `/api/my-applications` *(Protected)*

**Response:** `200 OK`

### Get Applications for a Tuition
**GET** `/api/tuitions/:tuitionId/applications` *(Protected)*

**Response:** `200 OK`

### Update Application Status
**PATCH** `/api/applications/:id` *(Protected)*

**Request Body:**
```json
{
  "status": "Approved"
}
```

**Response:** `200 OK`

### Delete Application
**DELETE** `/api/applications/:id` *(Protected)*

**Response:** `200 OK`

---

## 4. Payment Routes

### Record Payment
**POST** `/api/payments` *(Protected)*

**Request Body:**
```json
{
  "applicationId": "application_id",
  "amount": "5000",
  "tutorId": "tutor_id"
}
```

**Response:** `201 Created`

### Get User's Payment History
**GET** `/api/my-payments` *(Protected)*

**Response:** `200 OK`
```json
{
  "payments": [...],
  "totalPaid": 50000
}
```

### Get Tutor's Revenue History
**GET** `/api/tutor-revenue` *(Protected)*

**Response:** `200 OK`
```json
{
  "revenues": [...],
  "totalRevenue": 100000
}
```

---

## 5. User Profile Routes

### Update Profile
**PUT** `/api/profile` *(Protected)*

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "01234567890",
  "profileImage": "image_url"
}
```

**Response:** `200 OK`

### Get Latest Tutors
**GET** `/api/tutors/latest`

**Response:** `200 OK`

### Get All Tutors
**GET** `/api/tutors?page=1&limit=10`

**Response:** `200 OK`

### Get Tutor Profile
**GET** `/api/tutors/:id`

**Response:** `200 OK`

### Get Tutor's Ongoing Tuitions
**GET** `/api/tutor-ongoing-tuitions` *(Protected)*

**Response:** `200 OK`

### Get Applied Tutors for a Tuition
**GET** `/api/tuitions/:tuitionId/applied-tutors` *(Protected)*

**Response:** `200 OK`

---

## 6. Admin Routes (Admin Only)

### Get All Users
**GET** `/api/admin/users` *(Protected, Admin)*

**Response:** `200 OK`

### Update User
**PUT** `/api/admin/users/:id` *(Protected, Admin)*

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "Tutor",
  "status": "active"
}
```

**Response:** `200 OK`

### Delete User
**DELETE** `/api/admin/users/:id` *(Protected, Admin)*

**Response:** `200 OK`

### Get All Tuitions
**GET** `/api/admin/tuitions` *(Protected, Admin)*

**Response:** `200 OK`

### Get Pending Tuitions
**GET** `/api/admin/tuitions/pending` *(Protected, Admin)*

**Response:** `200 OK`

### Approve/Reject Tuition
**PATCH** `/api/admin/tuitions/:id` *(Protected, Admin)*

**Request Body:**
```json
{
  "status": "Approved"
}
```

**Response:** `200 OK`

---

## 7. Analytics Routes (Admin Only)

### Get Platform Analytics
**GET** `/api/admin/analytics` *(Protected, Admin)*

**Response:** `200 OK`
```json
{
  "analytics": {
    "users": {
      "total": 100,
      "students": 80,
      "tutors": 20,
      "admins": 1
    },
    "tuitions": {
      "total": 50,
      "approved": 40,
      "pending": 5,
      "rejected": 5
    },
    "applications": {
      "pending": 10,
      "approved": 30,
      "rejected": 5
    },
    "financial": {
      "totalEarnings": 500000,
      "totalTransactions": 50
    }
  }
}
```

### Get Transaction History
**GET** `/api/admin/transactions` *(Protected, Admin)*

**Response:** `200 OK`

---

## Error Responses

### Unauthorized (401)
```json
{
  "message": "No token provided"
}
```

### Forbidden (403)
```json
{
  "message": "Invalid or expired token"
}
```

### Not Found (404)
```json
{
  "message": "Resource not found"
}
```

### Server Error (500)
```json
{
  "message": "Server error",
  "error": "error_details"
}
```

---

## Database Collections

1. **users** - User accounts
2. **tuitions** - Tuition posts
3. **applications** - Tutor applications
4. **payments** - Transaction records

---

## Environment Variables

```
DB_USER=eTuitionBD
DB_PASS=your_password
DB_URI=mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```
