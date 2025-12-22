# Museum Management System - Backend Authentication

## Overview
This backend implements secure user authentication using **FastAPI**, **bcrypt**, and **PostgreSQL**. Passwords are securely hashed before storage, and validation is enforced at multiple levels.

## Architecture

```
Signup/Login Request
    ↓
FastAPI + Pydantic Validation (email format, password length ≥ 8)
    ↓
auth_routes.py (HTTP endpoints)
    ↓
db_sec.py (database logic + bcrypt)
    ↓
PostgreSQL Authentication Table
```

## Files

### 1. **db_sec.py** - Core Database & Security Layer
Contains low-level functions for password hashing and user authentication.

#### Functions:

**`hash_password(password: str) -> str`**
- Uses bcrypt with 12 salt rounds
- Converts plain text password to secure hash
- Returns hash as string

**`verify_password(password: str, hashed_password: str) -> bool`**
- Compares plain text password with stored hash
- Returns `True` if match, `False` otherwise
- Uses bcrypt.checkpw() for secure comparison

**`signup_user(name, email, role, password) -> dict`**
- Checks if email already exists
- Hashes password using `hash_password()`
- Stores hashed password in database
- Returns `{success, message, user_id}`

**`login_user(email, role, password) -> dict`**
- Queries user by email + role
- Verifies password using `verify_password()`
- Returns `{success, message, user}` with user data if successful

### 2. **auth_schemas.py** - Pydantic Models
Defines request/response validation schemas.

#### Request Schemas:

**`SignupRequest`**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "guide",
  "password": "securepass123"
}
```

**`LoginRequest`**
```json
{
  "email": "john@example.com",
  "role": "guide",
  "password": "securepass123"
}
```

#### Response Schemas:

**`SignupResponse`**
```json
{
  "success": true,
  "message": "User registered successfully!",
  "user_id": 1
}
```

**`LoginResponse`**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "guide"
  }
}
```

### 3. **auth_routes.py** - FastAPI Endpoints
HTTP routes for authentication.

#### Endpoints:

**POST `/api/auth/signup`**
- Request: `SignupRequest`
- Response: `SignupResponse` (201 Created)
- Validation:
  - Email format (Pydantic EmailStr)
  - Password length ≥ 8 characters
  - Role in ['admin', 'guide']
- Error: 400 Bad Request if email exists or validation fails

**POST `/api/auth/login`**
- Request: `LoginRequest`
- Response: `LoginResponse` (200 OK)
- Validation:
  - Email format
  - Password length ≥ 8 characters
  - Role in ['admin', 'guide']
- Error: 401 Unauthorized if credentials invalid

## Validation Flow

### Signup Flow:
```
Frontend Input
    ↓
Pydantic (EmailStr, password ≥ 8 chars, role validation)
    ↓
signup_user() checks duplicate email
    ↓
bcrypt hashes password
    ↓
Hash stored in PostgreSQL
```

### Login Flow:
```
Frontend Input
    ↓
Pydantic (EmailStr, password ≥ 8 chars, role validation)
    ↓
login_user() queries by email + role
    ↓
bcrypt.checkpw() compares plain password with stored hash
    ↓
Return user data if match, 401 if no match
```

## Database Schema

```sql
CREATE TABLE Authentication (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,  -- 'admin' or 'guide'
  password TEXT NOT NULL  -- bcrypt hashed
);
```

## Security Features

✅ **Bcrypt Hashing** - 12 salt rounds for strong security
✅ **Email Validation** - Pydantic EmailStr ensures valid format
✅ **Password Policy** - Minimum 8 characters enforced
✅ **Parameterized Queries** - Prevents SQL injection
✅ **Role-Based Checks** - Explicit role validation on login
✅ **HTTP Status Codes** - 201 Created, 400 Bad Request, 401 Unauthorized

## Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload

# Swagger UI available at
http://localhost:8000/docs
```

## Testing with cURL

### Signup
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin",
    "password": "securepass123"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "role": "admin",
    "password": "securepass123"
  }'
```

## Future Enhancements

- JWT tokens for session management
- Refresh token rotation
- Rate limiting on login attempts
- Email verification before signup
- Password reset functionality
- Account lockout after failed attempts

## Notes

- **Plain text passwords are NEVER stored** - only bcrypt hashes
- **CORS is configured** for frontend at localhost:3000/3001
- **Swagger documentation** auto-generated at `/docs`
- **Role must be explicitly checked** during login
