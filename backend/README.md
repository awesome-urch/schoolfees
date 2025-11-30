# School Fees Management System - Backend API

A comprehensive NestJS backend for managing school fees, payments, students, and administrative tasks with Paystack integration.

## Features

- 🔐 **Multi-role Authentication** (Super Admin, School Owners, School Staff)
- 🏫 **Multi-school Management** (One owner can manage multiple schools)
- 👨‍🎓 **Student Management** with Excel bulk upload
- 💰 **Fee Management** per class/session
- 💳 **Paystack Payment Integration**
- 📊 **Dashboard Analytics**
- 🏦 **Business Accounts** for payouts
- 📅 **Academic Sessions Management**
- 🔒 **JWT Authentication** (10-minute access tokens, 7-day refresh tokens)
- 🛡️ **Role-based Access Control**

## Tech Stack

- **Framework**: NestJS 10.x
- **Database**: MySQL with TypeORM
- **Authentication**: JWT + Passport
- **Payment Gateway**: Paystack
- **Validation**: class-validator
- **File Upload**: Multer
- **Excel Processing**: xlsx

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database and Paystack credentials.

3. **Create database and run migrations**:
   ```bash
   # The synchronize option is enabled in development
   # Tables will be auto-created on first run
   npm run start:dev
   ```

4. **Seed default data** (Optional):
   The system will auto-create default roles on startup.

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:5000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register school owner
- `POST /api/auth/login` - Login (all user types)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Schools
- `GET /api/schools` - Get all schools for owner
- `POST /api/schools` - Create school
- `GET /api/schools/:id` - Get school details
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school

### Students
- `GET /api/students/school/:schoolId` - Get all students
- `POST /api/students` - Create student
- `POST /api/students/bulk-upload` - Upload students via Excel
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Fees
- `GET /api/fees/school/:schoolId` - Get all fee types
- `POST /api/fees` - Create fee type
- `PUT /api/fees/:id` - Update fee type
- `DELETE /api/fees/:id` - Delete fee type

### Payments
- `POST /api/payments/initialize` - Initialize payment
- `GET /api/payments/verify/:reference` - Verify payment
- `GET /api/payments/school/:schoolId` - Get school payments
- `GET /api/payments/student/:studentId` - Get student payments

### Dashboard
- `GET /api/dashboard/stats/:schoolId` - Get dashboard statistics
- `GET /api/dashboard/recent-payments/:schoolId` - Get recent payments

### Academic Sessions
- `GET /api/sessions/school/:schoolId` - Get all sessions
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id` - Update session
- `PUT /api/sessions/:id/set-current` - Set as current session

### Business Accounts
- `GET /api/business-accounts/school/:schoolId` - Get accounts
- `POST /api/business-accounts` - Add account
- `POST /api/business-accounts/verify` - Verify account
- `PUT /api/business-accounts/:id/set-primary` - Set primary account

## Database Schema

### Main Tables
- `super_admins` - Platform administrators
- `school_owners` - School owners (require approval)
- `schools` - Schools (multi-school support)
- `roles` - Staff roles and permissions
- `school_staff` - School staff members
- `students` - Student records
- `classes` - Class/grade levels
- `academic_sessions` - Academic years/terms
- `fee_types` - Fee definitions
- `payments` - Payment transactions
- `settlements` - Paystack settlements
- `business_accounts` - Payout accounts
- `refresh_tokens` - JWT refresh tokens

## Security Features

- ✅ JWT with short-lived access tokens (10 minutes)
- ✅ Refresh token rotation
- ✅ Password hashing with bcrypt
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (TypeORM)
- ✅ Role-based access control

## Excel Upload Format

For bulk student upload, use this format:

| admission_number | first_name | last_name | email | phone | parent_name | parent_email | parent_phone | class_id |
|-----------------|------------|-----------|-------|-------|-------------|--------------|--------------|----------|
| STU001 | John | Doe | john@example.com | 08012345678 | Jane Doe | jane@example.com | 08087654321 | 1 |

## Default Roles

1. **School Admin** - Full access to school management
2. **Accountant** - Manage fees and payments
3. **Teacher** - View students and classes

## Environment Variables

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=school_fees_db

JWT_SECRET=your_secret_key
JWT_ACCESS_EXPIRATION=10m
JWT_REFRESH_EXPIRATION=7d

PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

FRONTEND_URL=http://localhost:3000
```

## Project Structure

```
src/
├── config/           # Configuration files
├── entities/         # TypeORM entities
├── modules/          # Feature modules
│   ├── auth/        # Authentication
│   ├── schools/     # School management
│   ├── students/    # Student management
│   ├── fees/        # Fee management
│   ├── payments/    # Payment processing
│   ├── dashboard/   # Analytics
│   └── ...
├── common/          # Shared utilities
│   ├── guards/      # Auth guards
│   ├── decorators/  # Custom decorators
│   └── filters/     # Exception filters
├── app.module.ts    # Root module
└── main.ts          # Entry point
```

## Support

For issues and questions, please open an issue in the repository.

## License

MIT
