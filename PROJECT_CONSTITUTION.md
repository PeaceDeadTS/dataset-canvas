# Project Constitution: Dataset Canvas

## 1. Project Overview

**Dataset Canvas** is a web application designed as a custom-built clone of Hugging Face's Data Studio. Its primary purpose is to provide a platform for managing, visualizing, and interacting with image datasets. The application supports user authentication, role-based access control, and allows authorized users to create datasets and upload image information via CSV files.

The project is architected with a distinct frontend and backend.

### Technology Stack

*   **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Axios, React Router DOM with URL parameter management, lazy loading optimization.
*   **Backend**: Node.js, Express.js, TypeScript, TypeORM with migration system, MariaDB/MySQL.
*   **Authentication**: JSON Web Tokens (JWT) with bcrypt password hashing.
*   **Internationalization**: react-i18next with browser language detection, localStorage persistence, and full TypeScript support for English and Russian locales.
*   **Development & Build**: Bun (primary runtime/package manager), ESLint with TypeScript rules, Vitest for testing.
*   **Additional Tools**: Winston logging, Multer + CSV-parser for file processing, Supertest for API testing, React Testing Library with JSDOM.

---

## 2. Key Architectural Decisions & Features

### 2.1. Backend Architecture

*   **Framework**: Express.js provides the routing and middleware structure with robust JWT authentication.
*   **Database**: MariaDB is used as the relational database. The system supports connections via both TCP/IP and more secure Unix sockets.
*   **ORM**: TypeORM manages database connections, entity definitions, and queries. The application relies on a **globally available database connection**, managed through a centralized `AppDataSource` instance (`src/data-source.ts`), ensuring consistency between the main application and command-line tools. The system consistently uses the `manager` property (e.g., `AppDataSource.manager`) to retrieve entity repositories. This architectural pattern is key to the testing strategy: the test setup script (`test-setup.ts`) establishes a global connection to an isolated test database *before* any tests run, allowing the application code to operate identically in both test and production environments without needing modification.
*   **Database Schema Management (Migrations)**: To ensure safety and predictability, the project uses a robust **migration-based workflow** instead of automatic schema synchronization (`synchronize: true`).
    *   **Technology**: TypeORM's built-in migration system is used to track and apply database schema changes in a safe, version-controlled manner.
    *   **Workflow**: When a change to an entity is made (e.g., adding a column), a developer generates a new migration file using the `npm run migration:generate` command. This file contains the raw SQL needed to apply the changes.
    *   **Deployment**: During deployment, the `npm run migration:run` command is executed on the production server. This command applies any pending migrations, bringing the database schema up to date with the application code. This process is safe, repeatable, and eliminates the risk of accidental data loss.
*   **Entities**:
    *   `User`: Stores user information, including `username`, `email`, hashed `password`, and `role`.
    *   `Dataset`: Represents a dataset "container," with properties like `name`, `description`, `isPublic`, and relationships to its owner (`user`) and its images. Includes a computed `imageCount` field populated via TypeORM's `loadRelationCountAndMap` for efficient display of total image counts. Enhanced with file management relationship.
    *   `DatasetImage`: Stores metadata for each image within a dataset, including `url`, `filename`, `width`, `height`, and `prompt`.
    *   `DatasetFile`: Manages uploaded CSV files with properties like `filename`, `originalName`, `mimeType`, `size`, `filePath`, and `description`. Includes cascade delete relationship to ensure file cleanup when datasets are removed.
*   **API**: A RESTful API is exposed under `/api` for all frontend-backend communication.
*   **Testable Entry Point**: The main application entry point (`src/index.ts`) is architected to be test-friendly. It exports the Express `app` instance separately from the server startup logic. This allows integration tests (like those using Supertest) to import and test the `app` directly without actually listening on a network port, ensuring tests are fast and isolated.
*   **Build Process**: The backend is written in TypeScript and must be compiled into JavaScript before running in production. The `npm run build` command handles this, outputting the final JavaScript files to the `dist` directory. To ensure a clean build process where compiled files have a flat structure, all source files, including the TypeORM configuration (`ormconfig.ts`), are located within the `src` directory, which is defined as the `rootDir` in `tsconfig.json`. The TypeScript configuration (`tsconfig.json`) is specifically set up to **exclude all test files** from the production build, preventing test-specific code and dependencies from ending up on the server.
*   **Custom Type Definitions**: To ensure full type safety with Express middleware, the project uses custom type definition files (located in `backend/src/types`). For instance, `express.d.ts` extends the global Express `Request` type to include the `user` object that is attached by the JWT authentication middleware. This allows for static analysis and autocompletion in a TypeScript environment.
*   **Production Deployment**: For production, the backend is designed to run as a `systemd` service. This provides robust, native process management, including automatic restarts on failure. The service is configured to use an `.env` file for environment variables, separating configuration from code.
*   **Data Integrity**:
    *   **Cascading Deletes**: To maintain data integrity, the relationship between `Dataset` and `DatasetImage` is configured with `onDelete: 'CASCADE'` on the database level. This is defined in the `DatasetImage` entity on the `@ManyToOne` decorator. This configuration ensures that when a dataset is deleted, all its associated image records are automatically and efficiently removed by the database, preventing orphaned data.
    *   **Overwrite on Upload**: The CSV upload endpoint (`POST /api/datasets/:id/upload`) operates in an "overwrite" mode. It first deletes all existing images in a dataset before inserting the new records, simplifying data updates.

### 2.2. Authentication & Authorization

*   **Mechanism**: Authentication is handled via JWT with two middleware approaches:
    *   **`checkJwt`**: Enforces authentication, returning 401 if no valid token is provided, sets `req.user` for authorized access
    *   **`checkJwtOptional`**: Allows optional authentication, properly sets `req.user` for authenticated requests while allowing anonymous access, essential for private dataset visibility logic
*   **Token Management**: Upon successful login, the server issues a token containing the user's `id`, `username`, `email`, and `role`. The client stores this token in `localStorage` and includes it in the `Authorization` header for all subsequent API requests.
*   **Role-Based Access Control (RBAC)**: The system defines three user roles with dataset-specific permissions:
    1.  `Administrator`: Full control over all users and datasets, including private datasets of other users, access to admin panel
    2.  `Developer`: Can create datasets and manage their own (both public and private)
    3.  `User`: Can create and view datasets, access to public datasets and their own private datasets
*   **Dataset Visibility Rules**:
    *   **Public datasets**: Visible to all users (authenticated and anonymous)
    *   **Private datasets**: Only visible to the dataset owner and administrators
    *   **Anonymous users**: Can only see public datasets
    *   **Authenticated users**: See all public datasets + their own private datasets
*   **Special Rule**: The very first user to register in the system is automatically granted the `Administrator` role.

### 2.3. Frontend Architecture

*   **Framework**: Built with React 18 and Vite for a fast development experience with optimized builds and hot module replacement.
*   **Performance Optimization**: Implements lazy loading for all pages with React.lazy() and Suspense, reducing main bundle size from 504KB to 313KB (gzipped from 158KB to 101KB). Automatic code splitting creates optimized chunks for better loading performance.
*   **Styling**: Utilizes Tailwind CSS for utility-first styling, with `shadcn/ui` for a pre-built, accessible component library. Implements responsive design patterns and modern CSS layout techniques (Flexbox, Grid).
*   **Internationalization (i18n)**: Complete multilingual support using react-i18next with:
    *   **Language Detection**: Automatic browser language detection with localStorage persistence for user preferences
    *   **Supported Languages**: English (default) and Russian with full interface translations
    *   **TypeScript Integration**: Full type safety for translation keys with custom type definitions
    *   **Dynamic Language Switching**: Real-time language switching with persistent storage
*   **State Management**: Global user state is managed via a custom `useAuth` hook that decodes the JWT with proper token validation and expiration handling. Component-level state is managed with `useState` and `useEffect`. The auth state properly synchronizes with dataset visibility logic. URL state management through React Router for pagination and filtering.
*   **Routing**: React Router DOM v6 is used for client-side routing with URL parameter management, enabling deep linking to specific pages and states (e.g., `?p=22&limit=50&tab=public`). Enhanced routing includes dedicated pages for users list and all datasets with URL state management.
*   **HTTP Client**: Axios with advanced interceptors for automatic JWT token management, request/response handling, and consistent API communication patterns. The axios instance automatically includes authentication headers and handles token refresh.
*   **Navigation System**: Revolutionary navigation menu architecture with:
    *   **Organized Menu Structure**: Logical grouping into sections (Main, Datasets, Community) with descriptive dropdown menus
    *   **Enhanced User Experience**: Modern navigation menu with icons, descriptions, and contextual links
    *   **Unified Interface**: Consistent navigation throughout all pages including dataset details
*   **User Experience**: Modern sticky layout system with fixed header/footer, intuitive breadcrumb navigation, loading states, error boundaries, and responsive modal dialogs.
*   **Shared Types**: To ensure consistency and prevent data-related bugs, the frontend uses a centralized file for shared TypeScript types (`src/types/index.ts`). All major data structures, like `User` and `Dataset`, are defined here and imported throughout the application.
*   **Administrative Panel**: Comprehensive admin interface (`/admin`) available exclusively to Administrator users with:
    *   **User Management**: Change user roles (Administrator, Developer, User) and delete users from the system
    *   **Dataset Management**: Force delete any datasets regardless of ownership
    *   **Safety Controls**: Admins cannot modify their own accounts to prevent lockouts
    *   **Audit Logging**: All administrative actions are logged with details for security tracking
    *   **Full Localization**: Complete translation support with proper i18n integration

### 2.4. User Experience & Interface Design

*   **Modern Layout Architecture**: Implemented a revolutionary sticky interface system that maximizes usability:
    *   **Fixed Header**: Dataset information, breadcrumb navigation, and dataset card remain accessible at all times
    *   **Scrollable Content Area**: Only the data table scrolls, providing focused interaction with large datasets
    *   **Sticky Footer**: Pagination controls and items-per-page selection always remain visible for easy navigation
*   **Responsive Design**: Full mobile and desktop responsiveness with adaptive layouts and touch-friendly interactions.
*   **Professional Data Visualization**: Clean, organized table layout optimized for data exploration with proper column sizing and overflow handling.
*   **Interactive Elements**: Hover states, loading indicators, smooth transitions, and click-to-expand functionality for detailed image inspection.
*   **Navigation Excellence**: Intuitive breadcrumb system, deep linking support with URL parameters, and consistent navigation patterns throughout the application.
*   **Accessibility Considerations**: Proper semantic HTML structure, keyboard navigation support, and ARIA attributes where appropriate.

---

## 3. Testing & Debugging Strategy

### 3.1. Testing Frameworks

*   **Unified Runner**: **Vitest** is used as the primary test runner for both the frontend and backend, providing a consistent and fast testing experience.
*   **Backend API Testing**: **Supertest** is used for integration tests on the Express API endpoints, allowing for simulation of real HTTP requests and validation of responses.
*   **Frontend Component Testing**: **React Testing Library** is used to test React components from a user's perspective, ensuring they render and behave correctly.

### 3.2. Test Environments

*   **Backend**: The backend test suite is completely isolated and safe. A setup script (`src/test/test-setup.ts`) programmatically connects to the database server, **creates a dedicated test database** (`dataset_canvas_test_safe`) if it doesn't exist, and then runs all tests against this isolated instance. The main application configuration (`ormconfig.ts`) is never used by tests, eliminating any risk to development or production data.
*   **Frontend**: **JSDOM** is used to simulate a browser environment, allowing component tests to run in a Node.js process without needing a real browser.
*   **Test Execution Isolation**: While Vitest serves as a unified runner, the frontend and backend test suites are designed to run independently. The root `package.json`'s `test` script is configured to run *only* the frontend tests (explicitly excluding the `backend` directory). Backend tests must be executed from within the `backend` directory to use their specific environment and configuration. This strict separation prevents configuration conflicts and ensures each part of the application is tested within its correct context.

### 3.3. Logging

*   **Library**: **Winston** is used on the backend for robust, configurable logging, replacing all `console.log` calls.
*   **Configuration**: Logs are written to both the console and dedicated files (`error.log`, `combined.log`) to ensure persistent records for debugging.

---

## 4. Resolved Issues & Bug Fixes

During development, several critical issues were identified and resolved:

*   **Private Dataset Visibility Bug**: Initially, private datasets were not properly displayed to their owners due to incomplete user authentication in the `checkJwtOptional` middleware. This was resolved by ensuring `req.user` is properly set for authenticated requests.
*   **Dataset Creation Response**: The dataset creation API was not returning complete user relationship data, causing frontend filtering issues. Fixed by explicitly loading the user relation in the response.
*   **Dataset Page Loading Issues**: The dataset detail page had redundant data fetching and syntax errors that caused empty pages. Resolved by consolidating data loading logic and fixing component structure.
*   **Authentication Context**: Fixed timing issues with user authentication state that caused inconsistent dataset visibility during page loads.
*   **Type Safety**: Enhanced TypeScript type definitions to handle optional user relationships and prevent runtime errors.
*   **Dataset Image Count Display**: The dataset cards on the main page showed "0 items" regardless of actual image count. Fixed by implementing proper image count calculation in the backend API using TypeORM's `loadRelationCountAndMap` functionality.
*   **File Extension Detection**: File extension was incorrectly extracted from filename instead of URL, causing "Unknown" extensions for many files. Resolved by implementing URL-based extension extraction.
*   **Aspect Ratio Calculation**: Aspect ratios displayed as confusing decimal values (e.g., 0.71). Implemented intelligent calculation using Greatest Common Divisor (GCD) for simplified fractions and automatic detection of standard ratios (16:9, 4:3, etc.).
*   **Image Modal Scrolling Issues**: Modal dialogs for image details had internal scrollbars due to improper size constraints. Fixed by implementing proper responsive sizing with viewport-relative constraints.
*   **Navigation UX**: Users had no easy way to return to the main page from dataset details. Implemented breadcrumb navigation with clickable "Datasets" link.
*   **Limited Dataset Viewing Area**: Dataset working area had excessive padding, wasting screen space. Expanded layout to utilize nearly full screen width while maintaining responsive design.
*   **Sticky Interface Layout**: Implemented a modern sticky layout system where the dataset header (including Dataset Card) remains fixed at the top and pagination controls stay anchored at the bottom. This allows users to scroll through large datasets while maintaining constant access to dataset information and navigation controls, significantly improving the user experience for data exploration.
*   **Localization Bug Fixes**: Fixed missing translation keys in the datasets page where the "Open Dataset" button was always displayed in Russian regardless of selected language. Added proper localization keys and ensured consistent translation across all interface elements.
*   **User Role Filtering Enhancement**: Resolved issue where filtering users by role (e.g., `/users?role=ADMIN`, `/users?role=DEVELOPER`) returned "No users found" due to incorrect role mapping between URL parameters and database enum values. Implemented proper role mapping system to convert URL parameters (`ADMIN`, `DEVELOPER`, `USER`) to database enum values (`Administrator`, `Developer`, `User`).
*   **Dataset Organization Improvement**: Enhanced the datasets page structure by implementing a three-tab system instead of two: "Public" (all public datasets), "My Public" (user's own public datasets), and "My Private" (user's private datasets). This provides clearer dataset organization and easier navigation for users to manage their own content separately from browsing all available datasets.
*   **Navigation Menu Enhancement**: Added missing navigation option for Regular Users (`/users?role=USER`) to complement existing Administrator and Developer filters, providing complete role-based user browsing capabilities through the Community menu.
*   **Administrative Panel Implementation**: Developed comprehensive admin panel with complete user and dataset management capabilities:
    *   **User Role Management**: Administrators can change user roles and delete users with proper safety controls
    *   **Dataset Force Deletion**: Admins can delete any dataset regardless of ownership through dedicated admin endpoint
    *   **Security Safeguards**: Implemented protection against self-modification to prevent admin lockout scenarios
    *   **Audit Trail**: All administrative actions are properly logged with user details and action timestamps
*   **User Permission Enhancement**: Modified dataset creation permissions to allow all authenticated users (including User role) to create datasets, removing the previous Developer-only restriction for better accessibility.
*   **Authentication System Overhaul**: Resolved JWT token management issues by implementing comprehensive axios interceptor system:
    *   **Automatic Token Injection**: All API requests automatically include JWT tokens in Authorization headers
    *   **Token Refresh Handling**: Automatic token refresh and storage from server responses
    *   **401 Error Handling**: Automatic logout and redirect on authentication failures
    *   **Centralized Configuration**: Single axios instance with consistent API communication patterns
*   **URL Duplication Bug**: Fixed critical bug where API URLs were duplicated (e.g., `/api/api/datasets`) due to conflicting base URL configurations, causing 404 errors.
*   **React Navigation Error**: Resolved React error #300 during logout by replacing window.location.href with proper React Router navigation, preventing component lifecycle conflicts.
*   **Global Authentication Context**: Implemented centralized AuthContext to replace multiple useAuth hook instances, ensuring consistent user state across all components and preventing authentication desynchronization issues.

---

## 5. Key Implemented Features

This section provides a summary of the core features implemented in the application.

*   **Full User Authentication**: Implemented complete user registration and login flow (`/api/auth/register`, `/api/auth/login`) using JWT and password hashing (`bcrypt`).
*   **Role-Based Access Control (RBAC)**: Developed a full RBAC system (Administrator, Developer, User) that governs all API actions with proper middleware implementation.
*   **CRUD API for Datasets**: Built a full CRUD API (`/api/datasets`) that respects RBAC rules for creating, reading, updating, and deleting datasets. The API properly handles user relations and authorization for private datasets.
*   **Private Dataset Support**: Full implementation of private dataset functionality with proper access control:
    *   Private datasets are only visible to their owners and administrators
    *   Public/private datasets are clearly distinguished in the UI with badges
    *   The `checkJwtOptional` middleware correctly identifies authenticated users for private dataset access
    *   Dataset creation API properly returns user relationship data for frontend processing
*   **Dataset Management UI**: Complete dataset management interface with:
    *   Separate sections for "My Private Datasets" and "Public Datasets" on the main page
    *   Dataset management buttons (Settings, Delete) for dataset owners and administrators
    *   Confirmation dialogs for destructive operations
    *   Visual indicators for dataset privacy status
*   **CSV Data Upload**: Implemented a `multer` and `csv-parser` pipeline on the backend (`POST /api/datasets/:id/upload`) to allow authorized users to upload image metadata via CSV files with proper authorization checks.
*   **Dataset Details Page**: Created a robust dynamic route (`/datasets/:id`) and page that displays detailed information and all images for a selected dataset with:
    *   Proper error handling for access denied and not found scenarios
    *   Unified data loading that handles both dataset metadata and image pagination
    *   Upload functionality for dataset owners and administrators
    *   **Advanced Pagination System**: Enhanced pagination with URL parameter support (`?p=22`) and configurable items per page (10/25/50/100), allowing direct navigation to specific pages and customizable viewing experience
    *   **Breadcrumb Navigation**: Implemented intuitive breadcrumb navigation with clickable "Datasets" link returning to the main page
    *   **Optimized Layout**: Expanded dataset working area to utilize nearly full screen width for better data visualization, similar to Hugging Face's Data Studio design
    *   **Modern Sticky Interface**: Revolutionary sticky layout system with fixed header and footer sections that remain visible during scrolling, providing constant access to dataset information and pagination controls while maximizing the scrollable area for image data exploration
*   **Enhanced Dataset Listing**: Improved dataset cards display with:
    *   **Accurate Image Count**: Fixed dataset item counter to show real number of uploaded images using TypeORM's `loadRelationCountAndMap` functionality
    *   Proper data fetching with image count from backend API
*   **Advanced Image Data Display**: Comprehensive image metadata presentation with:
    *   **Smart Column Organization**: Optimized table layout (Row → Image Key → Filename → Image → Dimensions → Prompt) for better data accessibility
    *   **Interactive Image Previews**: Click-to-expand modal dialogs with detailed image information
    *   **Smart Aspect Ratio Calculation**: Intelligent aspect ratio display using GCD (Greatest Common Divisor) for simplified fractions, with automatic detection of standard ratios (16:9, 4:3, etc.) and fallback to closest standard when appropriate
    *   **File Extension Detection**: Automatic file extension extraction from image URLs for proper file type identification
    *   **Clickable URLs**: Direct links to image sources both in table previews and detail modals
    *   **Responsive Modal Design**: Adaptive image detail modals that properly scale to different screen sizes and image dimensions
*   **Client-Side Auth Handling**: A custom `useAuth` hook decodes the JWT stored in `localStorage` to provide a consistent user object throughout the frontend application with proper token validation and expiration handling.
*   **Dynamic UI**: The user interface adapts based on the user's authentication status and role:
    *   Authenticated users see appropriate management options based on their permissions
    *   Private dataset owners have full management capabilities
    *   Administrators have management access to all datasets
    *   Anonymous users see only public datasets with appropriate call-to-action buttons
*   **Comprehensive User Management System**: Complete user directory and management functionality:
    *   **Users Directory Page** (`/users`): Comprehensive listing of all system users with advanced filtering and sorting capabilities
    *   **Role-Based User Filtering**: Complete navigation menu integration for filtering users by role (`/users?role=ADMIN`, `/users?role=DEVELOPER`, `/users?role=USER`) with proper role mapping between URL parameters and database enums
    *   **Advanced User Sorting**: Multi-criteria sorting by username, registration date, and public dataset count with ascending/descending order controls
    *   **User Profile Cards**: Professional user cards displaying avatars, roles, registration dates, and public dataset statistics
    *   **Enhanced User API** (`/api/users`): Backend endpoints supporting dynamic sorting and role-based filtering with proper access control for sensitive information
*   **Advanced Dataset Discovery System**: Comprehensive dataset browsing and organization:
    *   **All Datasets Page** (`/datasets`): Unified interface for browsing all available datasets with advanced filtering
    *   **Enhanced Three-Tab Interface**: Intelligent organization with separate tabs for "Public" (all public datasets), "My Public" (user's own public datasets), and "My Private" (user's private datasets) with URL state management (`?tab=public/my-public/my-private`)
    *   **Multi-Criteria Sorting**: Flexible sorting by name, creation date, image count, and author with persistent URL parameters
    *   **Enhanced Datasets API**: Backend support for complex sorting and filtering with proper access control and performance optimization
*   **Revolutionary Navigation System**: Modern, scalable navigation architecture:
    *   **Organized Menu Structure**: Logical grouping into Main, Datasets, and Community sections with descriptive dropdown menus
    *   **Enhanced Visual Design**: Modern navigation with icons, descriptions, and contextual help text for improved user experience
    *   **Unified Interface**: Consistent navigation throughout the entire application, including dataset detail pages
    *   **Language Selector Integration**: Seamless integration of language switching within the navigation system
*   **Complete Internationalization (i18n) System**: Comprehensive multilingual support:
    *   **Multi-Language Support**: Full interface translation for English (default) and Russian locales with complete coverage of all UI elements
    *   **Smart Language Detection**: Automatic browser language detection with localStorage persistence for user preferences
    *   **Real-Time Switching**: Dynamic language switching without page refresh, maintaining application state
    *   **Developer-Friendly Architecture**: Modular translation files organized by feature with TypeScript integration for type-safe translations
    *   **User Experience**: Intuitive language selector in the navigation menu with flag indicators and persistent selection
    *   **Quality Assurance**: Comprehensive localization coverage with systematic identification and correction of missing translation keys
*   **Performance Optimization & Modern Architecture**: Cutting-edge performance enhancements:
    *   **Lazy Loading Implementation**: Comprehensive lazy loading for all pages using React.lazy() and Suspense
    *   **Bundle Optimization**: Significant bundle size reduction from 504KB to 313KB (37% reduction) with intelligent code splitting
    *   **Loading Performance**: Improved initial load times with optimized chunk distribution and progressive loading
*   **Modern Interface Enhancements**: Revolutionary sticky layout design that provides professional-grade user experience:
    *   Fixed header with persistent dataset information and navigation
    *   Optimized scrolling area focused on data exploration
    *   Persistent footer with always-accessible pagination controls
    *   Responsive design that maximizes screen real estate utilization
    *   Enhanced data visualization with professional table layout and interactive elements
*   **Administrative Panel System**: Complete administrative control interface for system management:
    *   **Comprehensive User Management**: View all users with advanced filtering and sorting, change user roles (Administrator/Developer/User), and delete users with confirmation dialogs
    *   **Dataset Administration**: Force delete any dataset in the system regardless of ownership with proper confirmation and logging
    *   **Security Features**: Built-in safeguards prevent administrators from modifying their own accounts to avoid system lockouts
    *   **Audit and Logging**: All administrative actions are tracked and logged with detailed information for security and compliance
    *   **Professional UI**: Modern tabbed interface with data tables, role badges, and intuitive action buttons
    *   **Complete Localization**: Full translation support for all admin panel features in English and Russian
*   **Enhanced Authentication Architecture**: Robust authentication system with advanced JWT management:
    *   **Centralized Auth Context**: Single source of truth for user authentication state across all components using React Context
    *   **Automatic Token Management**: Axios interceptors automatically handle JWT token injection and refresh cycles
    *   **Smart Error Handling**: Automatic logout and redirect on authentication failures with proper error messaging
    *   **Session Persistence**: Secure token storage with automatic expiration handling and validation
*   **Universal Dataset Creation**: Democratized dataset creation allowing all authenticated users to create and manage datasets:
    *   **Role Accessibility**: Removed Developer-only restriction, now all user roles can create datasets
    *   **Consistent UI**: Updated all interface elements to reflect the new permission model
    *   **Proper Authorization**: Backend validation ensures only authenticated users can create datasets while maintaining security
*   **Revolutionary Dataset Page Architecture**: Modern tabbed interface system for dataset pages inspired by Hugging Face:
    *   **Four-Tab System**: Organized dataset information into distinct sections - Dataset Card, Data Studio, Files and versions, and Community
    *   **URL State Management**: Deep linking support with tab parameters (`?tab=data-studio`) while maintaining pagination state
    *   **Sticky Navigation**: Persistent tab navigation and footer pagination for optimal user experience
    *   **Responsive Layout**: Proper height management with scrollable content areas and fixed headers/footers
*   **Advanced Dataset Card System**: Comprehensive dataset information display and management:
    *   **Dataset Overview**: Professional card layout with metadata including author, creation date, and privacy status
    *   **Statistics Dashboard**: Real-time display of dataset metrics including total samples and image counts
    *   **Upload Integration**: Seamless CSV upload functionality directly integrated into the dataset card
    *   **Privacy Indicators**: Clear visual indicators for public/private dataset status with appropriate icons
*   **Enhanced Data Studio Interface**: Improved data visualization and interaction system:
    *   **Optimized Table Layout**: Professional data table with proper column sizing and sticky headers
    *   **Advanced Image Previews**: Interactive image thumbnails with modal dialogs for detailed inspection
    *   **Smart Aspect Ratio Display**: Intelligent aspect ratio calculation with standard format detection
    *   **Scrollable Content Area**: Properly implemented scrolling with persistent pagination controls
*   **Comprehensive File Management System**: Complete CSV file storage and retrieval architecture:
    *   **Backend File Storage**: Robust file storage system with dedicated `DatasetFile` entity and proper file organization
    *   **Secure File Handling**: Files stored in protected upload directories with unique naming and metadata tracking
    *   **Download Functionality**: Secure file download with proper MIME types and authentication checks
    *   **File Versioning Support**: Infrastructure for tracking multiple file versions and upload history
    *   **API Endpoints**: Dedicated endpoints for file listing (`/files`) and downloading (`/files/:id/download`)
*   **Community Infrastructure**: Foundation for user engagement and collaboration:
    *   **Discussion Framework**: Placeholder architecture for future discussion and commenting system
    *   **Community Statistics**: User engagement metrics and contribution tracking infrastructure
    *   **Modular Design**: Extensible component structure ready for community features implementation

---

## Document Version History

*Latest Update: January 2025 - Revolutionary Dataset Page Architecture: Implemented comprehensive tabbed interface system for dataset pages with four distinct sections (Dataset Card, Data Studio, Files and versions, Community), complete file management system with CSV storage and download functionality, enhanced data visualization with scrollable content areas and sticky pagination, URL state management for deep linking with tab parameters, and modular component architecture ready for future community features*

*Previous Update: January 2025 - Administrative Panel Implementation: Added comprehensive admin panel with complete user and dataset management capabilities, enhanced authentication architecture with centralized JWT management and axios interceptors, democratized dataset creation for all authenticated users, resolved critical authentication bugs and URL duplication issues, implemented centralized authentication context for consistent user state management across all components*

*January 2025 - Major feature expansion including comprehensive internationalization system with localization bug fixes, enhanced user management with role-based filtering, advanced three-tab dataset discovery system, performance optimization with lazy loading, and revolutionary navigation architecture with complete user role coverage*

*December 2024 - Added Modern Interface Enhancements including sticky layout system and improved UX patterns*