# School Fees Management Platform - Setup Instructions

## Project Overview

This is a comprehensive school fees management platform with:
- **Backend**: NestJS (TypeScript) with MySQL
- **Frontend**: Next.js (React) with Tailwind CSS
- **Payment**: Paystack integration
- **Features**: Multi-school management, student management, fee management, payments, role-based access

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=school_fees_db

JWT_SECRET=your_super_secret_key_here
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

Start MySQL and create database:
```sql
CREATE DATABASE school_fees_db;
```

Run backend:
```bash
npm run start:dev
```

Backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

Run frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Default Credentials

After first run, you can login as super admin:
- Email: `admin@schoolfees.com`
- Password: `Admin@123` (change this!)

## Project Structure

```
fees/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── entities/      # Database models
│   │   ├── modules/       # Feature modules
│   │   ├── common/        # Shared code
│   │   └── config/        # Configuration
│   └── package.json
│
└── frontend/         # Next.js App
    ├── src/
    │   ├── app/           # Next.js 13+ app directory
    │   ├── components/    # React components
    │   ├── lib/           # Utilities
    │   └── styles/        # CSS/Tailwind
    └── package.json
```

## Features Implemented

### Backend (NestJS)
✅ Database entities (12 tables)
✅ TypeORM configuration
✅ JWT authentication (10-min access, 7-day refresh)
✅ Role-based access control
✅ Paystack integration service
✅ Multi-school support
✅ File upload (Excel for students)

### Modules to Complete
- Auth module (login, register, refresh)
- Schools module (CRUD operations)
- Students module (CRUD + Excel upload)
- Fees module (fee types management)
- Payments module (Paystack integration)
- Dashboard module (statistics)
- Academic sessions module
- Business accounts module
- Roles module

### Frontend (Next.js)
- Landing page (stunning design)
- Authentication pages
- School owner dashboard
- Student management interface
- Fee management
- Payment interface for students
- Admin approval system

## Next Steps

1. **Install Dependencies**: Run `npm install` in both backend and frontend folders
2. **Configure Database**: Set up MySQL and update `.env`
3. **Run Backend**: The database tables will auto-create on first run (development mode)
4. **Run Frontend**: Access the landing page
5. **Test Registration**: Register as a school owner
6. **Super Admin Approval**: Use super admin to approve school owners

## API Documentation

Once backend is running, API endpoints are available at:
- Base URL: `http://localhost:5000/api`
- Auth: `/api/auth/*`
- Schools: `/api/schools/*`
- Students: `/api/students/*`
- Fees: `/api/fees/*`
- Payments: `/api/payments/*`

## Development Notes

- Backend uses TypeORM with `synchronize: true` in development (auto-creates tables)
- JWT tokens expire in 10 minutes (use refresh token to get new access token)
- School owners need super admin approval before they can login
- One owner can manage multiple schools
- Excel upload format for students is documented in backend README

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check credentials in `.env`
- Verify database exists

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Use `npm run dev -- -p 3001`

### TypeScript Errors
- Run `npm install` to install all dependencies
- Restart your IDE/editor

## Support

For issues, check the README files in backend and frontend directories.
