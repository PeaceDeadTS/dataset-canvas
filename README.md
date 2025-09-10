# Dataset Canvas

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)

Dataset Canvas is a comprehensive web application inspired by Hugging Face's Data Studio, designed for professional dataset management and visualization. Built with modern technologies, it provides a robust platform for managing image datasets with advanced features like role-based access control, CSV data imports, and intelligent image metadata processing.

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure JWT-based authentication** with token management
- **Role-Based Access Control (RBAC)**:
  - **Administrator**: Full control over all datasets and users
  - **Developer**: Can create datasets and manage their own (public/private)
  - **User**: Read-only access to public datasets
- **First user auto-promotion** to Administrator role

### 📊 Dataset Management
- **Complete CRUD operations** for datasets
- **Public/Private dataset support** with visibility controls
- **CSV data upload** with intelligent parsing (filename, url, width, height, prompt columns)
- **Advanced pagination system** with URL parameter support (`?p=22`, customizable items per page: 10/25/50/100)
- **Smart dataset organization** with separate sections for private and public datasets

### 🖼️ Advanced Image Data Display
- **Interactive image previews** with click-to-expand modals
- **Comprehensive metadata presentation**:
  - Smart aspect ratio calculation using GCD (Greatest Common Divisor)
  - Automatic detection of standard ratios (16:9, 4:3, etc.)
  - File extension detection from URLs
  - Clickable image URLs for direct access
- **Optimized table layout** with responsive column sizing
- **Sticky header/footer interface** - dataset info stays visible while scrolling through images

### 🎨 Modern User Interface
- **Responsive design** with Tailwind CSS and shadcn/ui components
- **Sticky layout system**: Header and pagination remain fixed while table scrolls
- **Breadcrumb navigation** for easy navigation between views
- **Full-screen utilization** for optimal data visualization
- **Loading states and error handling** throughout the application

### 🛠️ Technical Excellence
- **Database migrations** for safe schema management
- **Comprehensive testing** with Vitest for both frontend and backend
- **Type-safe development** with TypeScript throughout
- **Production-ready deployment** with systemd service configuration
- **Centralized logging** with Winston
- **Development tools**: ESLint, testing utilities, and development servers

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
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   
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
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: React Router DOM with URL parameter management
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
- `GET /api/datasets` - List datasets (with role-based filtering)
- `GET /api/datasets/:id` - Get dataset details with paginated images
- `POST /api/datasets` - Create new dataset (Developer/Admin)
- `PUT /api/datasets/:id` - Update dataset (Owner/Admin)
- `DELETE /api/datasets/:id` - Delete dataset (Owner/Admin)
- `POST /api/datasets/:id/upload` - Upload CSV data (Owner/Admin)

### Query Parameters
- `?page=N` - Pagination page number
- `?limit=N` - Items per page (10, 25, 50, 100)

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
│   │   └── ...            # Custom components
│   ├── pages/             # Route components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript type definitions
├── backend/               # Backend source code
│   ├── src/
│   │   ├── entity/        # TypeORM entities
│   │   ├── routes/        # Express routes
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