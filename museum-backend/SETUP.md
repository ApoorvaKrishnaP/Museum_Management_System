# 🚀 Backend Authentication Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

The following packages will be installed:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `psycopg2` - PostgreSQL adapter
- `python-dotenv` - Environment variables
- `bcrypt==4.0.1` - Password hashing
- `pydantic` - Request validation
- `email-validator` - Email validation

### 2. Ensure Database Table Exists
```sql
CREATE TABLE Authentication (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL
);
```

### 3. Configure Environment
Create `.env` file in `museum-backend/` with:
```
DATABASE_URL=postgresql://user:password@localhost:5432/museum_db
```

### 4. Start Server
```bash
uvicorn main:app --reload
```

Server runs at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

---

## 📁 File Overview

| File | Purpose |
|------|---------|
| `db_sec.py` | Bcrypt hashing, database queries for signup/login |
| `auth_schemas.py` | Pydantic models for request/response validation |
| `auth_routes.py` | FastAPI endpoints (/api/auth/signup, /api/auth/login) |
| `main.py` | FastAPI app setup, route inclusion, CORS configuration |
| `requirements.txt` | Python dependencies |

---

## 🔐 Security Implementation

### ✅ What's Implemented:
- **Bcrypt Hashing**: Password hashed with 12 salt rounds before storage
- **Email Validation**: Pydantic EmailStr ensures valid email format
- **Password Policy**: Minimum 8 characters enforced
- **SQL Injection Prevention**: Parameterized queries used throughout
- **Role-Based Validation**: 'admin' or 'guide' explicitly checked
- **Proper HTTP Status Codes**: 201 Created, 401 Unauthorized, 400 Bad Request

### ❌ Not Implemented (Future):
- JWT/Session tokens
- Password reset
- Email verification
- Rate limiting

---

## 📌 Integration Points

### From Frontend
1. Call `POST /api/auth/signup` with `SignupRequest`
2. Call `POST /api/auth/login` with `LoginRequest`
3. Parse responses from `SignupResponse` / `LoginResponse`

### Backend Flow
1. Pydantic validates input (email format, password length)
2. Route handler calls `db_sec.py` functions
3. Bcrypt hashes password or verifies existing hash
4. Database stores/queries hashed passwords only
5. Return status code + response

---

## 🧪 Test Endpoints

### Signup
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "role": "guide",
    "password": "Password123"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "guide",
    "password": "Password123"
  }'
```

---

## 📊 Database Password Storage

### Before (❌ Insecure):
```
Database: email=test@example.com, password=Password123
```

### After (✅ Secure with Bcrypt):
```
Database: email=test@example.com, password=$2b$12$abc123...xyz789
```

Only the hash is stored. Plain password is never saved.

---

## 🔍 Debugging

### Check if bcrypt is installed:
```bash
python -c "import bcrypt; print(bcrypt.__version__)"
```

### Test password hashing:
```bash
python -c "
import bcrypt
pwd = 'test123'
hashed = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt(rounds=12))
print(hashed.decode())
"
```

### Check PostgreSQL connection:
```bash
python -c "
from database import get_conn
conn = get_conn()
print('Connected:', conn)
conn.close()
"
```

---

## ✨ Summary

Your backend now has:
- ✅ Secure password hashing with bcrypt
- ✅ Email validation with Pydantic
- ✅ Two FastAPI endpoints for signup/login
- ✅ Proper error handling and HTTP status codes
- ✅ CORS configured for frontend
- ✅ Auto-generated Swagger documentation

Ready to integrate with frontend! 🎉
