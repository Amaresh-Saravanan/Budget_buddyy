# 💰 BudgetBuddy

A modern, full-stack expense tracking and budget management application built with React and Node.js.

![BudgetBuddy](https://img.shields.io/badge/BudgetBuddy-Finance%20Tracker-bb86fc?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Screenshots](#-screenshots)

## ✨ Features

### Core Features
- **Expense Tracking** - Add, edit, and delete expenses with categories
- **Budget Management** - Set monthly budgets and category-wise limits
- **Savings Goals** - Create and track savings goals with progress
- **Reminders** - Set payment reminders with recurring options
- **Analytics Dashboard** - Visual insights with charts and statistics

### Authentication & Security
- **Clerk Authentication** - Secure login with Google/Meta OAuth
- **Email/Password Sign-up** - Traditional registration with email verification
- **JWT Token-based API** - Secure backend communication

### User Experience
- **Dark/Light Theme** - Toggle between themes
- **Responsive Design** - Works on desktop and mobile
- **Real-time Sync** - Data persists across devices
- **Gamification** - Points, badges, and streaks for engagement

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Clerk React | Authentication |
| Lucide React | Icons |
| Recharts | Data Visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| Drizzle ORM | Database ORM |
| Neon DB | PostgreSQL Database |
| Clerk SDK | Auth Verification |

## 📁 Project Structure

```
Budget_buddyy/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Calendar.jsx
│   │   │   ├── ExpenseForm.jsx
│   │   │   ├── ExpenseList.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Reminders.jsx
│   │   │   ├── Savings.jsx
│   │   │   └── SmartAlerts.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Analytics.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/         # API service layer
│   │   │   └── api.js
│   │   ├── context/          # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── .env.local            # Frontend environment variables
│   └── package.json
│
├── backend/                  # Express backend API
│   ├── config/
│   │   └── db.js             # Neon/Drizzle database connection
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── expenseController.js
│   │   ├── savingController.js
│   │   └── reminderController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   ├── models/
│   │   └── schema.js         # Drizzle schema definitions
│   ├── routes/               # API route definitions
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── savingRoutes.js
│   │   └── reminderRoutes.js
│   ├── server.js             # Express server entry
│   ├── .env                  # Backend environment variables
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Neon DB account (free tier available)
- Clerk account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/budgetbuddy.git
   cd budgetbuddy
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables** (see [Environment Variables](#-environment-variables))

5. **Push database schema**
   ```bash
   cd backend
   npm run db:push
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

8. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Neon Database Connection
# Get from: https://console.neon.tech/
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Clerk Authentication
# Get from: https://dashboard.clerk.com/ -> API Keys
CLERK_SECRET_KEY=sk_test_xxxxx

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env.local`)
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sync` | Sync user from Clerk |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/settings` | Update user settings |
| PUT | `/api/auth/gamification` | Update gamification stats |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/:id` | Get single expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/stats` | Get expense statistics |

### Savings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/savings` | Get all savings |
| POST | `/api/savings` | Create saving entry |
| GET | `/api/savings/goals` | Get saving goals |
| POST | `/api/savings/goals` | Create saving goal |
| PUT | `/api/savings/goals/:id` | Update saving goal |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reminders` | Get all reminders |
| POST | `/api/reminders` | Create reminder |
| PUT | `/api/reminders/:id` | Update reminder |
| DELETE | `/api/reminders/:id` | Delete reminder |
| PUT | `/api/reminders/:id/complete` | Mark as complete |
| GET | `/api/reminders/upcoming` | Get upcoming reminders |

## 🗄 Database Schema

### Users Table
```sql
users (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  image_url TEXT,
  settings JSONB DEFAULT {...},
  gamification JSONB DEFAULT {...},
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Expenses Table
```sql
expenses (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  amount REAL NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20),
  tags JSONB DEFAULT [],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Saving Goals Table
```sql
saving_goals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  deadline TIMESTAMP,
  icon VARCHAR(10) DEFAULT '🎯',
  color VARCHAR(20) DEFAULT '#00ff88',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)
```

### Reminders Table
```sql
reminders (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount REAL DEFAULT 0,
  date TIMESTAMP NOT NULL,
  time VARCHAR(10) DEFAULT '09:00',
  category VARCHAR(50) DEFAULT 'Other',
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)
```

## 📸 Screenshots

### Landing Page
- Modern dark theme with gradient accents
- Feature highlights and call-to-action

### Dashboard
- Overview of expenses, savings, and budget status
- Quick add expense functionality
- Recent transactions list

### Analytics
- Category-wise expense breakdown
- Monthly spending trends
- Budget utilization charts

### Settings
- Profile management
- Budget configuration
- Notification preferences

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ for better financial management.

---

**"A budget is telling your money where to go instead of wondering where it went."** - Dave Ramsey
