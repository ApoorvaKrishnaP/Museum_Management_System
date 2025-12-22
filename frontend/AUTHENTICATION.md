# Frontend Authentication Integration Guide

## Overview
The frontend has been fully integrated with the backend authentication system using React hooks, localStorage, and API calls.

## File Structure

```
frontend/app/
├── components/
│   ├── LoginForm.tsx          # Login form component with validation
│   ├── SignupForm.tsx         # Signup form component with validation
│   └── validation.js          # Email & password validation utilities
├── page.tsx                   # Home page with login/signup modals
├── admin/
│   └── page.tsx              # Admin dashboard (auth protected)
└── guide/
    └── page.tsx              # Guide dashboard (auth protected)
```

## Components

### 1. **LoginForm.tsx**
React component for user login with email validation and password verification.

**Props:**
- `onLoginSuccess(user)` - Callback when login succeeds
- `onClose()` - Callback to close the form modal

**Features:**
- Email format validation (uses validation.js)
- Password length validation (≥ 8 characters)
- Calls `POST /api/auth/login` endpoint
- Stores user data in localStorage
- Displays API error messages

**Usage:**
```tsx
<LoginForm 
  onLoginSuccess={(user) => handleLoginSuccess(user)}
  onClose={() => setShowLogin(false)}
/>
```

### 2. **SignupForm.tsx**
React component for user registration with input validation.

**Props:**
- `onSignupSuccess(data)` - Callback when signup succeeds
- `onClose()` - Callback to close the form modal

**Features:**
- Validates name, email, role, and password
- Calls `POST /api/auth/signup` endpoint
- Shows validation errors before API call
- Displays API error messages
- Role selection (admin/guide)

**Usage:**
```tsx
<SignupForm
  onSignupSuccess={(data) => handleSignupSuccess(data)}
  onClose={() => setShowSignup(false)}
/>
```

### 3. **validation.js**
Utility functions for input validation (frontend-level).

**Functions:**

```javascript
isValidEmail(email) → boolean
// Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/

isValidPassword(password) → boolean
// Check: password.length > 8

validateSignup(name, email, password) → { isValid, errors }
// Combined validation for signup

validateLogin(email, password) → { isValid, errors }
// Combined validation for login
```

## Pages

### Home Page (page.tsx)
**Features:**
- Shows login/signup buttons if user is NOT logged in
- Shows user name and role if logged in
- Displays logout button for authenticated users
- Redirects to admin/guide dashboard after successful auth
- Modal popups for login and signup forms

**Key Functions:**
```tsx
handleSignupSuccess(userData) 
  → Sets user state
  → Stores in localStorage
  → Redirects to /admin or /guide based on role

handleLoginSuccess(userData)
  → Same as signup success

handleLogout()
  → Clears localStorage
  → Resets user state
  → Hides modals
```

### Admin Dashboard (admin/page.tsx)
**Auth Protection:**
```tsx
useEffect(() => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) router.push('/');
  
  const userData = JSON.parse(savedUser);
  if (userData.role !== 'admin') router.push('/');
}, [router]);
```

- Only admins can access
- Shows "Welcome, [name]!" in navbar
- Logout button clears localStorage and redirects to home

### Guide Dashboard (guide/page.tsx)
**Auth Protection:**
```tsx
useEffect(() => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) router.push('/');
  
  const userData = JSON.parse(savedUser);
  if (userData.role !== 'guide') router.push('/');
}, [router]);
```

- Only guides can access
- Shows "Welcome, [name]!" in navbar
- Logout button clears localStorage and redirects to home

## Data Flow

### Signup Flow:
```
User fills signup form
    ↓
Frontend validation (isValidEmail, isValidPassword)
    ↓
Show errors if invalid
    ↓
POST /api/auth/signup
    ↓
Backend validates with Pydantic (EmailStr, password ≥ 8)
    ↓
Backend hashes password with bcrypt
    ↓
Database stores user
    ↓
localStorage.setItem('user', ...)
    ↓
Redirect to /admin or /guide
```

### Login Flow:
```
User fills login form
    ↓
Frontend validation
    ↓
POST /api/auth/login
    ↓
Backend queries by email + role
    ↓
Backend verifies password with bcrypt
    ↓
Return user data or 401 error
    ↓
localStorage.setItem('user', ...)
    ↓
Redirect to /admin or /guide
```

### Logout Flow:
```
User clicks Logout
    ↓
localStorage.removeItem('user')
    ↓
Redirect to home (/)
```

## API Endpoints

### POST /api/auth/signup
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "guide",
  "password": "SecurePass123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully!",
  "user_id": 1
}
```

**Error Response (400):**
```json
{
  "detail": "Email already exists or invalid role."
}
```

### POST /api/auth/login
**Request:**
```json
{
  "email": "john@example.com",
  "role": "guide",
  "password": "SecurePass123"
}
```

**Success Response (200):**
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

**Error Response (401):**
```json
{
  "detail": "Invalid credentials. Incorrect password."
}
```

## Local Storage

**Key:** `user`
**Value (after login):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "guide"
}
```

**Cleared on:**
- Logout click
- Access to unauthorized role page

## Error Handling

### Frontend Validation Errors:
- Show in yellow alert box
- List all validation issues
- Prevent API call

### API Errors:
- Show in red alert box
- Display `detail` from backend response
- Allow user to retry

### Network Errors:
- Show generic network error message
- Catch in try/catch block

## Testing the Integration

### 1. Signup as Guide:
1. Click "Sign Up" button
2. Fill form: name=Test, email=test@example.com, role=guide, password=TestPass123
3. Should redirect to /guide

### 2. Signup as Admin:
1. Click "Sign Up" button
2. Fill form with role=admin
3. Should redirect to /admin

### 3. Login after signup:
1. Logout first
2. Click "Login" button
3. Enter same credentials
4. Should redirect to corresponding dashboard

### 4. Auth protection:
1. Try accessing /admin as a guide (should redirect to home)
2. Try accessing /guide as admin (should redirect to home)
3. Try accessing without logging in (should redirect to home)

## Important Notes

✅ **What's working:**
- Frontend validation before API call
- Secure backend authentication with bcrypt
- Role-based dashboard access
- User state persistence with localStorage
- Logout functionality
- Modal-based login/signup UI

❌ **Not implemented (future):**
- JWT token refresh
- Session timeout
- Email verification
- Password reset
- Social login

## Environment Configuration

**Backend URL:** `http://localhost:8000`

Update in `.env.local` if needed (currently hardcoded in components):
```tsx
const response = await fetch('http://localhost:8000/api/auth/login', ...)
```

For production, move to environment variables:
```tsx
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
const response = await fetch(`${BACKEND_URL}/api/auth/login`, ...);
```

## Running the Application

### 1. Start Backend:
```bash
cd museum-backend
uvicorn main:app --reload
```

### 2. Start Frontend:
```bash
cd frontend
npm run dev
```

### 3. Open in Browser:
```
http://localhost:3000
```

## Troubleshooting

**Issue:** Login fails with CORS error
- **Solution:** Check backend CORS configuration in main.py

**Issue:** User data not persisting after reload
- **Solution:** Check localStorage in browser DevTools

**Issue:** Redirect not working
- **Solution:** Ensure role matches (admin/guide) and user object is set

**Issue:** Password validation too strict
- **Solution:** Backend requires ≥ 8 characters (frontend matches this)
