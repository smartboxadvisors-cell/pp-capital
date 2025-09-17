# Login Setup & Testing Guide

## 🔧 Setup Steps

1. **Configure Environment Variables**
   - Edit `/workspace/backend/.env`
   - Set your desired EMAIL and PASSWORD:
   ```
   EMAIL=admin@example.com
   PASSWORD=your_secure_password
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Start Frontend**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

## 🧪 Test Login

Use these credentials (or update in `.env`):
- **Email**: admin@example.com
- **Password**: your_secure_password

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to server"
- **Solution**: Make sure backend is running on port 5000
- **Check**: Visit http://localhost:5000 - should show `{"ok":true}`

### Issue 2: "Server configuration error"
- **Solution**: Check that EMAIL and PASSWORD are set in `/workspace/backend/.env`

### Issue 3: "Invalid email or password"
- **Solution**: Make sure you're using the exact credentials from your `.env` file
- **Note**: Email comparison is case-insensitive, but password is case-sensitive

### Issue 4: CORS errors
- **Solution**: Backend is configured for localhost:5173 and localhost:5175
- **Check**: Make sure frontend is running on one of these ports

## 🔍 Debug Tips

1. **Check browser console** for detailed error messages
2. **Check backend console** for server-side errors
3. **Verify API endpoint** - login attempts are logged to console
4. **Test backend directly**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"your_secure_password"}'
   ```

## ✅ Success Indicators

- Login form submits without errors
- Console shows "Login successful, redirecting..."
- User is redirected to main page
- Token is stored in localStorage