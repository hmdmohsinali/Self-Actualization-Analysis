# Self Actualization Analysis - Backend API

A complete Node.js/Express backend API with user authentication, password reset functionality, and OAuth support.

## Features

- ✅ User Registration & Login
- ✅ JWT-based Authentication
- ✅ Password Reset (Forgot Password)
- ✅ OAuth Integration (Google & Facebook)
- ✅ Email Notifications (Nodemailer)
- ✅ MongoDB Database
- ✅ Error Handling
- ✅ Input Validation
#done
#done
#done
## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email services
- **Vercel** for deployment

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database (local or cloud like MongoDB Atlas)
- Email service credentials (Gmail, SendGrid, etc.)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd self-actualization-analysis
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/self-actualization-analysis
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Self Actualization
FRONTEND_URL=http://localhost:3000

# CORS Configuration (optional, comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/oauth` - OAuth callback (Google/Facebook)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-reset-token` - Verify reset token
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)

### Health Check

- `GET /health` - Server health check

## Development

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard:
     - `MONGO_URI` - Your MongoDB connection string
     - `JWT_SECRET` - Your JWT secret key
     - `JWT_EXPIRE` - Token expiration (default: 7d)
     - `SMTP_HOST` - Email SMTP host
     - `SMTP_PORT` - Email SMTP port
     - `SMTP_USER` - Email SMTP username
     - `SMTP_PASS` - Email SMTP password
     - `EMAIL_FROM` - Sender email address
     - `EMAIL_FROM_NAME` - Sender name
     - `FRONTEND_URL` - Your frontend URL
   - Click "Deploy"

3. **Vercel will automatically:**
   - Detect the `vercel.json` configuration
   - Build and deploy your application
   - Provide you with a deployment URL

### Environment Variables in Vercel

After deployment, add all environment variables in Vercel Dashboard:
- Go to your project → Settings → Environment Variables
- Add all variables from your `.env` file
- Redeploy if needed

### MongoDB Atlas Setup (Recommended for Production)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist IP addresses (or use `0.0.0.0/0` for Vercel)
5. Get your connection string and use it as `MONGO_URI`

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/self-actualization-analysis?retryWrites=true&w=majority
```

## Project Structure

```
self-actualization-analysis/
├── src/
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   └── authController.js  # Authentication controllers
│   ├── middlewares/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── asyncHandler.js   # Async error handler
│   ├── models/
│   │   └── User.js           # User model/schema
│   ├── routes/
│   │   └── authRoutes.js     # Authentication routes
│   ├── utils/
│   │   ├── email.js          # Email service (Nodemailer)
│   │   ├── jwt.js            # JWT utilities
│   │   ├── validation.js     # Input validation
│   │   └── errorHandler.js   # Error handling
│   ├── app.js                # Express app configuration
│   └── server.js             # Server entry point
├── .gitignore                # Git ignore file
├── vercel.json               # Vercel configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## Security Notes

- Never commit `.env` file to version control
- Use strong, random `JWT_SECRET` (minimum 32 characters)
- Use environment-specific values for different environments
- Rotate secrets regularly in production
- Use App Passwords for Gmail instead of main password
- For production, use professional email services (SendGrid, AWS SES, Mailgun)

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

