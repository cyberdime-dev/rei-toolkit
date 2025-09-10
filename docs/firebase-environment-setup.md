# Firebase Environment Setup Guide

## 🔥 Firebase Environment Configuration

### 📋 **Files Overview**

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.example` | Template with placeholder values | ✅ Yes |
| `.env.local` | Your actual development values | ❌ No |
| `.env` | Current development config | ❌ No |

### 🛠️ **Local Development Setup**

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your Firebase project values:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `rei-toolkit-8f051`
   - Navigate to: **Project Settings** > **General** > **Your apps**
   - Copy the config values to `.env.local`

### 🚀 **Production Deployment (Vercel)**

Set these environment variables in your Vercel dashboard:

```bash
# Firebase Production Config
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=rei-toolkit-8f051.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rei-toolkit-8f051
VITE_FIREBASE_STORAGE_BUCKET=rei-toolkit-8f051.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=417904863816
VITE_FIREBASE_APP_ID=1:417904863816:web:6416ebeb4c0f832702c67d
VITE_FIREBASE_MEASUREMENT_ID=G-KC37KB5GK6

# Production Settings
VITE_NODE_ENV=production
VITE_USE_FIREBASE_EMULATORS=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### 🏗️ **Environment Variables Explained**

#### **Firebase Core Config**
- `VITE_FIREBASE_API_KEY`: Your Firebase Web API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Authentication domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Cloud Storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Cloud Messaging sender ID
- `VITE_FIREBASE_APP_ID`: Firebase Web App ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Google Analytics measurement ID

#### **Development Settings**
- `VITE_USE_FIREBASE_EMULATORS`: Enable local Firebase emulators
- `VITE_FIRESTORE_EMULATOR_PORT`: Firestore emulator port (8080)
- `VITE_AUTH_EMULATOR_PORT`: Auth emulator port (9099)

#### **Feature Flags**
- `VITE_ENABLE_OFFLINE_SUPPORT`: Enable offline functionality
- `VITE_ENABLE_REAL_TIME_SYNC`: Enable real-time synchronization
- `VITE_ENABLE_AUTO_BACKUP`: Enable automatic data backups
- `VITE_ENABLE_ANALYTICS`: Enable Google Analytics
- `VITE_ENABLE_PERFORMANCE_MONITORING`: Enable performance tracking

### 🔒 **Security Notes**

1. **Never commit** actual API keys to git
2. **Use different Firebase projects** for development/production
3. **Restrict API keys** in Firebase Console for production
4. **Set up Firebase Security Rules** properly

### 🧪 **Testing Your Setup**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Check the browser console** for Firebase connection status

3. **Verify emulator connection** (if enabled):
   - Firestore: http://localhost:8080
   - Auth: http://localhost:9099
   - Emulator UI: http://localhost:4000

### 🐛 **Troubleshooting**

| Issue | Solution |
|-------|----------|
| Firebase not connecting | Check API key and project ID |
| Emulators not starting | Run `firebase init emulators` |
| CORS errors | Check auth domain configuration |
| Build errors | Ensure all VITE_ prefixed variables |

### 📚 **Additional Resources**

- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
