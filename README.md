# Dataset Canvas

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)

Dataset Canvas is a comprehensive web application inspired by Hugging Face's Data Studio, designed for professional dataset management and visualization. Built with modern technologies and international accessibility in mind, it provides a robust platform for managing image datasets with advanced features like multilingual support, comprehensive administrative panel, enhanced authentication architecture, role-based access control, CSV data imports, and intelligent image metadata processing.

## 🆕 Latest Updates (January 2025)

### ⚡ Administrative Panel
- **New Admin Interface**: Comprehensive `/admin` panel exclusively for administrators
- **Complete User Management**: Change roles, delete users, view system statistics
- **Dataset Administration**: Force delete any dataset with proper audit logging
- **Security Features**: Built-in safeguards prevent admin account lockouts

### 🔐 Enhanced Authentication
- **Centralized Auth Context**: Unified user state management across all components
- **Automatic Token Management**: Axios interceptors handle JWT tokens seamlessly
- **Universal Dataset Creation**: All authenticated users can now create datasets
- **Smart Error Handling**: Automatic logout and redirect on authentication failures

### 🐛 Critical Bug Fixes
- **Fixed URL Duplication**: Resolved `/api/api/datasets` 404 errors from conflicting configurations
- **React Navigation Error**: Fixed logout errors by implementing proper React Router navigation
- **Authentication Sync**: Resolved user state inconsistencies between components

## ✨ Features

### 🌍 Internationalization & Accessibility
- **Multi-language support**: Complete interface translation for English (default) and Russian with 100% coverage
- **Smart language detection**: Automatic browser language detection with persistent user preferences
- **Real-time language switching**: Dynamic language changes without page refresh
- **TypeScript integration**: Type-safe translations with full IDE support
- **Modern language selector**: Intuitive language switcher with flag indicators
- **Quality assurance**: Comprehensive localization testing with systematic bug fixes for missing translation keys

### 👥 User Management System
- **Comprehensive user directory** (`/users`): Complete listing of all system users
- **Role-based filtering**: Filter users by role through navigation menu (`/users?role=ADMIN`, `/users?role=DEVELOPER`, `/users?role=USER`)
- **Advanced sorting capabilities**: Sort users by name, registration date, or public dataset count
- **User profile cards**: Professional display with avatars, roles, and statistics
- **Direct profile navigation**: Click-through to individual user profiles
- **Complete role coverage**: Navigation menu includes options for all user roles (Administrators, Developers, Regular Users)

### 📊 Advanced Dataset Discovery
- **All datasets page** (`/datasets`): Unified browsing interface for all available datasets
- **Enhanced three-tab system**: Separate tabs for "Public" (all public datasets), "My Public" (user's own public datasets), and "My Private" (user's private datasets)
- **Intelligent URL state management**: Tab selection preserved in URL parameters (`?tab=public/my-public/my-private`)
- **Multi-criteria sorting**: Sort by name, creation date, image count, or author
- **Enhanced filtering**: Advanced dataset organization with persistent URL parameters
- **Seamless navigation**: Deep linking support with URL state preservation

### 🔐 Authentication & Authorization
- **Secure JWT-based authentication** with advanced token management and axios interceptors
- **Centralized Authentication Context**: Global user state management with React Context
- **Automatic Token Handling**: JWT tokens automatically included in all API requests
- **Role-Based Access Control (RBAC)**:
  - **Administrator**: Full control over all datasets and users, access to admin panel
  - **Developer**: Can create datasets and manage their own (public/private)
  - **User**: Can create datasets and view public content, manage own private datasets
- **First user auto-promotion** to Administrator role
- **Smart Session Management**: Automatic logout and redirect on authentication failures

### ⚡ Administrative Panel
- **Comprehensive Admin Interface** (`/admin`): Exclusive administrative control panel for system management
- **User Management System**:
  - View all users with advanced filtering and sorting capabilities
  - Change user roles (Administrator, Developer, User) with confirmation dialogs
  - Delete users from the system with proper safety controls
  - Protection against self-modification to prevent admin lockouts
- **Dataset Administration**:
  - Force delete any dataset regardless of ownership
  - Comprehensive dataset overview with owner information and statistics
  - Confirmation dialogs and audit logging for all administrative actions
- **Security & Compliance**:
  - All administrative actions are logged with detailed audit trails
  - Built-in safeguards prevent system lockout scenarios
  - Professional UI with modern tabbed interface and data tables
- **Full Localization**: Complete translation support for all admin features

### 📊 Dataset Management
- **Universal Dataset Creation**: All authenticated users can create and manage datasets
- **Complete CRUD operations** for datasets with proper authorization controls
- **Public/Private dataset support** with intelligent visibility controls
- **CSV data upload** with intelligent parsing (filename, url, width, height, prompt columns)
- **Advanced pagination system** with URL parameter support (`?p=22`, customizable items per page: 10/25/50/100)
- **Smart dataset organization** with separate sections for private and public datasets
- **Administrative Override**: Admins can manage any dataset regardless of ownership

### 🖼️ Advanced Image Data Display
- **Interactive image previews** with click-to-expand modals
- **Comprehensive metadata presentation**:
  - Smart aspect ratio calculation using GCD (Greatest Common Divisor)
  - Automatic detection of standard ratios (16:9, 4:3, etc.)
  - File extension detection from URLs
  - Clickable image URLs for direct access
- **Optimized table layout** with responsive column sizing
- **Sticky header/footer interface** - dataset info stays visible while scrolling through images

### 🎨 Modern User Interface & Navigation
- **Revolutionary navigation system**: Organized menu structure with logical grouping (Main, Datasets, Community)
- **Enhanced visual design**: Modern dropdown menus with icons, descriptions, and contextual help
- **Unified interface**: Consistent navigation throughout the entire application
- **Responsive design** with Tailwind CSS and shadcn/ui components
- **Sticky layout system**: Header and pagination remain fixed while table scrolls
- **Breadcrumb navigation** for easy navigation between views
- **Full-screen utilization** for optimal data visualization
- **Loading states and error handling** throughout the application

### ⚡ Performance Optimization
- **Lazy loading implementation**: All pages load on-demand using React.lazy() and Suspense
- **Significant bundle reduction**: Main bundle size reduced from 504KB to 313KB (37% improvement)
- **Intelligent code splitting**: Automatic chunk optimization for faster loading
- **Progressive loading**: Improved initial load times with optimized resource distribution

### 🛠️ Technical Excellence
- **Advanced Authentication Architecture**: Centralized auth context with React Context API for consistent state management
- **Automated HTTP Management**: Axios interceptors for automatic JWT token injection, refresh, and error handling
- **Database migrations** for safe schema management with TypeORM
- **Comprehensive testing** with Vitest for both frontend and backend
- **Type-safe development** with TypeScript throughout and complete i18n integration
- **Production-ready deployment** with systemd service configuration
- **Centralized logging** with Winston and detailed audit trails for admin actions
- **Security-first design**: Built-in safeguards, input validation, and secure session management
- **Development tools**: ESLint, testing utilities, development servers, and comprehensive error handling

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or newer recommended)
- **Bun** (recommended) or **npm** package manager
- **MariaDB** or **MySQL** database server

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PeaceDeadTS/dataset-canvas.git
   cd dataset-canvas
   ```

2. **Install dependencies:**
   ```bash
   # Frontend dependencies (including i18n support)
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   
   # Install internationalization dependencies if not already included
   npm install react-i18next i18next i18next-browser-languagedetector
   
   # Backend dependencies
   cd backend
   bun install  # or npm install
   cd ..
   ```

3. **Database setup:**
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=dataset_canvas
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Optional: Unix Socket (overrides host/port for production)
   # DB_SOCKET_PATH=/var/run/mysqld/mysqld.sock
   ```

4. **Run database migrations:**
   ```bash
   cd backend
   npm run migration:run
   ```

### Development

Start both servers simultaneously:

1. **Backend server** (in `backend/` directory):
   ```bash
   npm run dev  # Development with nodemon
   # or
   npm start    # Production mode
   ```
   Backend runs on `http://localhost:5000`

2. **Frontend server** (in root directory):
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with custom middleware
- **Database**: TypeORM with MariaDB/MySQL
- **Authentication**: JWT with bcrypt password hashing
- **File Processing**: Multer + CSV-parser for data uploads
- **Logging**: Winston with file and console outputs
- **Testing**: Vitest with Supertest for API testing

### Frontend
- **Build Tool**: Vite for fast development and optimized builds
- **Framework**: React 18 with TypeScript and lazy loading optimization
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: React Router DOM with URL parameter management and deep linking
- **Internationalization**: react-i18next with browser detection and TypeScript integration
- **Performance**: Intelligent code splitting and lazy loading for optimal bundle size
- **HTTP Client**: Axios with JWT token management
- **State Management**: Custom hooks with localStorage persistence
- **Testing**: Vitest with React Testing Library and JSDOM

### Development & Deployment
- **Package Manager**: Bun (recommended) or npm
- **Linting**: ESLint with TypeScript rules
- **Type Safety**: Full TypeScript coverage with custom type definitions
- **Database Migrations**: TypeORM migration system
- **Production**: systemd service with environment configuration

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication

### Dataset Endpoints
- `GET /api/datasets` - List datasets (with role-based filtering and sorting)
- `GET /api/datasets/:id` - Get dataset details with paginated images
- `POST /api/datasets` - Create new dataset (Developer/Admin)
- `PUT /api/datasets/:id` - Update dataset (Owner/Admin)
- `DELETE /api/datasets/:id` - Delete dataset (Owner/Admin)
- `POST /api/datasets/:id/upload` - Upload CSV data (Owner/Admin)

### User Management Endpoints
- `GET /api/users` - List all users with sorting and role filtering options (sortBy: username/createdAt/publicDatasetCount, role: ADMIN/DEVELOPER/USER)
- `GET /api/users/:username` - Get user profile and their datasets

### Query Parameters
- `?page=N` - Pagination page number
- `?limit=N` - Items per page (10, 25, 50, 100)
- `?sortBy=field` - Sorting field (username/createdAt/publicDatasetCount for users; name/createdAt/imageCount/username for datasets)
- `?order=ASC/DESC` - Sort order (ascending or descending)
- `?role=ADMIN/DEVELOPER/USER` - User role filtering (for `/api/users` endpoint and `/users` page)
- `?tab=public/my-public/my-private` - Dataset tab selection (for `/datasets` page)

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Frontend tests (from root directory)
npm test

# Backend tests (from backend directory)
cd backend
npm test

# Interactive test UI
npm run test:ui
```

## 📁 Project Structure

```
dataset-canvas/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── AppHeader.tsx   # Main navigation header
│   │   ├── DatasetBreadcrumb.tsx  # Dataset navigation
│   │   ├── LanguageSelector.tsx   # Language switcher
│   │   └── ...            # Other custom components
│   ├── pages/             # Route components
│   │   ├── Users.tsx      # Users directory page
│   │   ├── AllDatasets.tsx # All datasets page
│   │   └── ...            # Other page components
│   ├── locales/           # Internationalization files
│   │   ├── en/           # English translations
│   │   │   ├── common.json
│   │   │   ├── navigation.json
│   │   │   └── pages.json
│   │   └── ru/           # Russian translations
│   │       ├── common.json
│   │       ├── navigation.json
│   │       └── pages.json
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   │   └── i18n.ts       # Internationalization config
│   └── types/             # TypeScript type definitions
│       └── i18next.d.ts   # i18n type definitions
├── backend/               # Backend source code
│   ├── src/
│   │   ├── entity/        # TypeORM entities
│   │   ├── routes/        # Express routes
│   │   │   ├── users.ts   # User management endpoints
│   │   │   └── datasets.ts # Dataset endpoints
│   │   ├── middleware/    # Custom middleware
│   │   └── types/         # Backend type definitions
│   └── ...
├── public/                # Static assets
└── ...
```

## 🚀 Deployment

### Production Build

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Build the backend:**
   ```bash
   cd backend
   npm run build
   ```

3. **Configure systemd service** (Linux):
   ```ini
   [Unit]
   Description=Dataset Canvas Backend
   
   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/dataset-canvas/backend
   ExecStart=/usr/bin/node dist/index.js
   EnvironmentFile=/path/to/.env
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

### Environment Variables (Production)

```env
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-password
DB_NAME=dataset_canvas_production
JWT_SECRET=your-very-secure-jwt-secret
NODE_ENV=production

# Optional Unix Socket
DB_SOCKET_PATH=/var/run/mysqld/mysqld.sock
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Hugging Face's Data Studio](https://huggingface.co/spaces/huggingface/data-studio)
- Built with [shadcn/ui](https://ui.shadcn.com/) component library
- Powered by modern web technologies and best practices

---

**Dataset Canvas** - Professional dataset management made simple. 🎨✨