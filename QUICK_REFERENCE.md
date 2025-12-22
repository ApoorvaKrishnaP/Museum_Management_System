# 🎯 Quick Reference - Authentication System

## 🚀 Start Both Services

```bash
# Terminal 1 - Backend
cd museum-backend
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev

# Open http://localhost:3000
```

## 📋 Test Flows

### Flow 1: New User Signup
```
1. Click "Sign Up" button
2. Fill form:
   - Name: John Doe
   - Email: john@example.com
   - Role: guide
   - Password: Password123
3. Click "Sign Up"
4. Auto-redirect to /guide dashboard
5. See "Welcome, John Doe! (guide)" in navbar
```

### Flow 2: User Login
```
1. Click "Logout" to clear session
2. Click "Login" button
3. Fill:
   - Email: john@example.com
   - Role: guide
   - Password: Password123
4. Click "Login"
5. Auto-redirect to /guide dashboard
```

### Flow 3: Admin Access
```
1. Signup with role: admin
2. Auto-redirect to /admin dashboard
3. Try visiting /guide → redirected to /
4. Logout → back to home
```

## 🔒 Security Features

| Feature | Status | Implementation |
|---------|--------|-----------------|
| Password Hashing | ✅ | bcrypt (12 salt rounds) |
| Email Validation | ✅ | Pydantic EmailStr + regex |
| Password Length | ✅ | Minimum 8 characters |
| Role Check | ✅ | admin / guide explicit check |
| SQL Injection Prevention | ✅ | Parameterized queries |
| Auth Protection | ✅ | useEffect role check |
| Session Management | ✅ | localStorage + logout |
| CORS Configuration | ✅ | Frontend origin allowed |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `museum-backend/db_sec.py` | Auth logic (hash, verify, signup, login) |
| `museum-backend/auth_routes.py` | FastAPI endpoints |
| `frontend/components/LoginForm.tsx` | Login UI component |
| `frontend/components/SignupForm.tsx` | Signup UI component |
| `frontend/app/page.tsx` | Home page with modals |
| `frontend/app/admin/page.tsx` | Admin dashboard (protected) |
| `frontend/app/guide/page.tsx` | Guide dashboard (protected) |

## 🌐 API Reference

### Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "guide",
    "password": "Password123"
  }'
```

**Success:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully!",
  "user_id": 1
}
```

**Error:** `400 Bad Request`
```json
{
  "detail": "Email already exists or invalid role."
}
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "role": "guide",
    "password": "Password123"
  }'
```

**Success:** `200 OK`
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

**Error:** `401 Unauthorized`
```json
{
  "detail": "Invalid credentials. Incorrect password."
}
```

## 🔍 Check Password Hash in Database

```sql
-- Connect to PostgreSQL
psql -U postgres -d museum_db

-- View authentication table
SELECT id, name, email, role, password FROM Authentication;

-- Password should look like: $2b$12$abc123...xyz789 (NOT plaintext)
```

## 📦 Dependencies

### Backend
```bash
pip install fastapi uvicorn bcrypt pydantic email-validator psycopg2 python-dotenv
```

### Frontend
```bash
npm install  # Already in package.json
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS Error** | Check backend `main.py` line with `CORSMiddleware` |
| **Login fails** | Verify password is > 8 characters in both frontend & backend |
| **User not persisting** | Check localStorage in DevTools (F12 → Application → Local Storage) |
| **Redirect not working** | Verify role in localStorage matches (admin/guide) |
| **Database connection error** | Check `DATABASE_URL` in `.env` file |
| **bcrypt not installed** | Run `pip install bcrypt==4.0.1` |

## 💾 localStorage Structure

**Key:** `user`
**Set After:** Successful login/signup
**Cleared After:** Logout click

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "guide"
}
```

## ⚡ Component Props

### LoginForm
```tsx
<LoginForm
  onLoginSuccess={(user) => console.log(user)}
  onClose={() => setShowLogin(false)}
/>
```

### SignupForm
```tsx
<SignupForm
  onSignupSuccess={(data) => console.log(data)}
  onClose={() => setShowSignup(false)}
/>
```

## 🔐 Validation Rules

| Field | Frontend | Backend |
|-------|----------|---------|
| **Email** | Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Pydantic EmailStr |
| **Password** | Length > 8 | Length ≥ 8 |
| **Role** | Dropdown (admin/guide) | Explicit check |
| **Name** | Non-empty | Min length 1 |

## 📊 Status Codes

| Code | Meaning | When |
|------|---------|------|
| **201** | Created | Successful signup |
| **200** | OK | Successful login |
| **400** | Bad Request | Validation failed, duplicate email |
| **401** | Unauthorized | Wrong password, user not found |

## 🎯 Next Steps (Optional)

1. [ ] Add JWT tokens for stateless auth
2. [ ] Implement refresh token rotation
3. [ ] Add email verification
4. [ ] Implement password reset
5. [ ] Add rate limiting
6. [ ] Move backend URL to `.env`
7. [ ] Use httpOnly cookies instead of localStorage
8. [ ] Add audit logging

## 📚 Documentation Files

- `IMPLEMENTATION_SUMMARY.md` - Complete overview
- `INTEGRATION_CHECKLIST.md` - Testing & verification
- `museum-backend/AUTH_README.md` - Backend details
- `museum-backend/SETUP.md` - Backend setup
- `frontend/AUTHENTICATION.md` - Frontend details

## ✨ One-Command Test

### Test with Swagger UI
```bash
# After starting backend
open http://localhost:8000/docs
```
- Try signup/login endpoints directly in Swagger
- See request/response examples

---

**Everything is ready to go! Start both services and test the authentication flow.** 🚀
