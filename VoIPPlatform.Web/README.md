# VoIPPlatform.Web - Admin Dashboard

A modern, production-ready React admin dashboard for the VoIP Platform API built with React 18, Vite, and Tailwind CSS.

## 🎨 Features

- **Dark Theme UI** - Luxurious dark mode with violet/purple accents
- **JWT Authentication** - Secure login with token-based authentication
- **Role-Based Access Control** - Admin and Customer roles
- **Responsive Dashboard** - Real-time statistics and metrics
- **User Management** - Full CRUD operations for users (Admin only)
- **Profile Management** - View and manage user profile
- **Toast Notifications** - Beautiful toast notifications for user feedback

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **React Router DOM v6** - Client-side routing
- **Axios** - HTTP client for API requests
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Toast notifications

## 📂 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx  # Main layout wrapper
│   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   └── Topbar.jsx           # Top navigation bar
│   ├── ui/
│   │   ├── Button.jsx           # Reusable button component
│   │   ├── Card.jsx             # Card component
│   │   ├── Input.jsx            # Input field component
│   │   └── Table.jsx            # Data table component
│   └── guards/
│       └── ProtectedRoute.jsx   # Route protection wrapper
├── context/
│   └── AuthContext.jsx          # Authentication context
├── pages/
│   ├── Login.jsx                # Login page
│   ├── Dashboard.jsx            # Dashboard with stats
│   ├── Users.jsx                # User management (Admin)
│   └── Profile.jsx              # User profile page
├── services/
│   └── api.js                   # Axios configuration & API calls
├── App.jsx                      # Main app component with routing
└── main.jsx                     # Entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- VoIPPlatform.API running on `http://localhost:5004`

### Installation

1. Navigate to the project directory:
```bash
cd VoIPPlatform.Web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

### Default Credentials

- **Username:** `MasterAdmin`
- **Password:** `MasterPass123!`

## 📡 API Integration

The frontend connects to the backend API at `http://localhost:5004/api`

### API Endpoints Used

**Authentication:**
- `POST /api/Auth/login` - User login
- `GET /api/Auth/me` - Get current user

**Dashboard:**
- `GET /api/Dashboard/stats` - Get dashboard statistics (Admin)

**Users:**
- `GET /api/Users` - List all users (Admin)
- `GET /api/Users/{id}` - Get user by ID (Admin)
- `POST /api/Users` - Create new user (Admin)
- `PUT /api/Users/{id}` - Update user (Admin)
- `DELETE /api/Users/{id}` - Delete user (Admin)

## 🎨 Design System

### Colors

- **Primary:** Violet (600-700) - `#9333ea` to `#7e22ce`
- **Background:** Slate (900-950) - `#0f172a` to `#020617`
- **Cards:** Slate 800 - `#1e293b`
- **Borders:** Slate 700 - `#334155`

### Components

All UI components follow a consistent dark theme design:
- Rounded corners (lg: 8px, xl: 12px, 2xl: 16px)
- Smooth transitions (200ms)
- Hover states with opacity/color changes
- Focus states with violet ring

## 🔐 Authentication Flow

1. User enters credentials on `/login`
2. API validates and returns JWT token
3. Token stored in `localStorage`
4. Token automatically attached to all API requests via Axios interceptor
5. Protected routes check for valid token
6. Token expiry handled with automatic logout

## 🧭 Routing

- `/login` - Public login page
- `/dashboard` - Protected dashboard (All authenticated users)
- `/users` - Protected user management (Admin only)
- `/profile` - Protected user profile (All authenticated users)

## 📦 Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## 🔧 Configuration

### Change API URL

Edit `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: 'http://your-api-url/api',
  // ...
});
```

### Customize Theme

Edit `tailwind.config.js` to customize colors and theme.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🎯 Next Steps

- [ ] Add SMS management page
- [ ] Add Calls history page
- [ ] Add Invoice management
- [ ] Add Reports page
- [ ] Implement real-time notifications
- [ ] Add user creation modal
- [ ] Add password change functionality

## 📄 License

Part of the VoIPPlatform project.

---

Built with ❤️ using React, Vite, and Tailwind CSS
