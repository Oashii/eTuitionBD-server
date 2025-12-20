## 📋 Project Overview

**eTuitionBD Server** is a RESTful API backend powering the tuition management platform. Handles authentication, tuition management, applications, payments, and admin control with 39+ endpoints.

### Core Features

✅ JWT & Firebase Auth | ✅ Tuition CRUD | ✅ Applications | ✅ Payment Tracking | ✅ User Management | ✅ Role-based Access | ✅ Admin Analytics | ✅ Search & Pagination

### Tech Stack

**Express 5** • MongoDB 7 • JWT 9 • bcryptjs 3 • CORS • dotenv • Stripe 20

## 🔄 Data Flow

1. **User Registration** → Data stored in MongoDB → JWT token generated
2. **Post Tuition** → Status set to "Pending" → Awaiting admin approval
3. **Tutor Application** → Creates application record → Student reviews
4. **Approve Tutor** → Redirect to payment → Transaction recorded
5. **Payment Completion** → Update application status to "Approved"

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
**Status:** Production Ready
