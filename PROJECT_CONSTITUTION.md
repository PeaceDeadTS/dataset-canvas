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
    *   `User`: Stores user information, including `username`, `email`, hashed `password`, `role`, and `theme` (user's preferred UI theme: light/dark/system).
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
    *   **Smart Update on Upload**: The CSV upload endpoint (`POST /api/datasets/:id/upload`) implements intelligent update logic that preserves `image_key` (UUID) for existing images. When a CSV is uploaded:
        *   **Existing Images**: Matched by URL (or `img_key` if present in CSV) and updated with new data while preserving their original `image_key` and database ID
        *   **New Images**: Created with new UUID `image_key` for images not found in the dataset
        *   **Removed Images**: Images present in the database but missing from the CSV are automatically deleted
        *   **Statistics Tracking**: Upload response includes detailed statistics (total, updated, new, deleted counts) for transparency
        *   This approach maintains stable image identifiers across dataset updates, essential for tracking edit history and maintaining data integrity in caption editing and discussion systems.

### 2.2. Authentication & Authorization

*   **Mechanism**: Authentication is handled via JWT with two middleware approaches:
    *   **`checkJwt`**: Enforces authentication, returning 401 if no valid token is provided, sets `req.user` for authorized access
    *   **`checkJwtOptional`**: Allows optional authentication, properly sets `req.user` for authenticated requests while allowing anonymous access, essential for private dataset visibility logic
*   **Token Management**: Upon successful login, the server issues a token containing the user's `id`, `username`, `email`, and `role`. The client stores this token in `localStorage` and includes it in the `Authorization` header for all subsequent API requests.
*   **Remember Me Functionality**: Advanced session persistence system for long-term user sessions:
    *   **Flexible Token Expiration**: Tokens have different lifetimes based on user preference - 1 hour for standard login, 30 days for "Remember Me" sessions
    *   **Smart Token Preservation**: JWT middleware intelligently preserves original token expiration time during automatic refresh cycles, preventing premature session termination
    *   **Seamless User Experience**: Users with "Remember Me" enabled remain authenticated across browser sessions and page refreshes for up to 30 days
    *   **Security Balance**: Short-lived tokens for temporary sessions (1 hour) provide security for shared devices, while long-lived tokens (30 days) offer convenience for personal devices
*   **Token Refresh Architecture**: Sophisticated token management system that maintains session integrity:
    *   **Automatic Refresh**: On every authenticated API request, middleware regenerates tokens with preserved expiration time
    *   **Expiration Preservation**: New tokens maintain the original expiration timestamp from the initial login, respecting "Remember Me" settings
    *   **Client-Side Sync**: Axios interceptors automatically capture refreshed tokens from response headers and update `localStorage`
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
*   **Image Loading Optimization**: Advanced lazy loading system for efficient handling of large image datasets:
    *   **Intersection Observer API**: Custom LazyImage component using Intersection Observer to load images only when they enter the viewport
    *   **Native Lazy Loading**: Browser-level lazy loading with `loading="lazy"` attribute for additional optimization
    *   **Viewport Buffering**: Pre-loading images 50px before they become visible for smooth scrolling experience
    *   **Loading States**: Visual feedback with animated skeleton placeholders during image load
    *   **Smooth Transitions**: CSS transitions for graceful image appearance with opacity fade-in
    *   **Performance at Scale**: Optimized to handle 100+ images per page without browser connection throttling issues
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
*   **Theme System & User Settings**: Comprehensive personalized theming system with database persistence:
    *   **Personal Theme Preferences**: Each user has individual theme settings stored in the database, ensuring consistent experience across devices and sessions
    *   **Three Theme Modes**: Light, Dark, and System (follows OS preferences) with smooth transitions and proper color contrast
    *   **Theme Architecture**: Centralized ThemeContext managing theme state with automatic synchronization to backend via REST API
    *   **Database Storage**: User theme preferences stored in `users.theme` column, eliminating cross-user theme conflicts from localStorage
    *   **Hybrid Approach**: Authenticated users get server-side theme persistence, anonymous users fall back to localStorage
    *   **Professional Color Palette**: Dark theme inspired by GitHub Dark, Discord, and VS Code with carefully balanced contrast for reduced eye strain
    *   **CSS Variables System**: HSL-based color system using CSS custom properties for seamless theme switching without page reload
    *   **Settings Dialog**: Modern modal interface for user preferences with theme selection, language settings, and future extensibility
    *   **API Endpoints**: Dedicated endpoints (`GET/PATCH /api/users/me/settings`) for managing user preferences
    *   **Real-time Updates**: Theme changes apply immediately across all components with automatic localStorage fallback for offline scenarios
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
*   **Session Persistence Issue**: Resolved critical session management bug where users were unexpectedly logged out after page refresh:
    *   **Root Cause**: JWT middleware was overwriting long-lived tokens with fixed 1-hour expiration on every API request, ignoring the original "Remember Me" setting
    *   **Impact**: Users who selected "Remember Me" (30-day tokens) were forcibly logged out after 1 hour due to automatic token regeneration
    *   **Solution**: Implemented intelligent token refresh mechanism that extracts and preserves original expiration timestamp (`exp`) from incoming JWT, then regenerates tokens with the same remaining lifetime
    *   **Result**: "Remember Me" functionality now works as intended - users stay authenticated for 30 days across browser sessions and page refreshes, while standard logins maintain 1-hour security for shared devices
*   **Image Loading Performance Issue**: Resolved critical performance problem when displaying 100+ images in Data Studio:
    *   **Root Cause**: Browser connection limits (6-8 concurrent HTTP requests per domain) caused image loading to stall during scrolling, as browsers would cancel pending requests for off-screen images and queue new ones for visible content
    *   **Impact**: Users experienced frozen image loading when scrolling through large datasets; images would remain in loading state until manual interaction (clicking) triggered request resumption
    *   **Solution**: Implemented comprehensive lazy loading system using Intersection Observer API with custom LazyImage component that only initiates image loading when elements are near or within the viewport (50px buffer zone), combined with native browser lazy loading (`loading="lazy"`) and visual loading states
    *   **Result**: Smooth, performant image loading even with 100+ images per page; images load progressively as user scrolls without overwhelming browser connection pool or causing load interruptions
*   **Dataset Update Image Key Persistence Issue**: Resolved critical data integrity problem where `image_key` (UUID identifiers) were being regenerated on every dataset CSV upload:
    *   **Root Cause**: Upload endpoint used "delete all + insert" approach, completely removing all existing images before inserting new ones, causing all images to receive new UUID identifiers
    *   **Impact**: Image identifiers changed with every dataset update, breaking the entire purpose of having stable image keys for tracking edit history, caption changes, and maintaining data consistency across the system
    *   **Solution**: Implemented intelligent "Smart Update" logic that matches incoming CSV rows with existing database records by URL (primary) or `img_key` from CSV (if provided), preserving original `image_key` and database ID for existing images while only assigning new UUIDs to genuinely new images
    *   **Enhanced Features**: System now tracks and reports detailed statistics (total, updated, new, deleted counts) and automatically removes images no longer present in the updated CSV
    *   **Result**: Stable image identifiers maintained across dataset updates, ensuring data integrity for caption edit history, discussions, and all image-related tracking systems

---

## 5. Key Implemented Features

This section provides a summary of the core features implemented in the application.

*   **Full User Authentication**: Implemented complete user registration and login flow (`/api/auth/register`, `/api/auth/login`) using JWT and password hashing (`bcrypt`) with advanced session management:
    *   **Remember Me Support**: User-controlled session persistence with checkbox on login form
    *   **Flexible Token Lifetime**: 1-hour tokens for standard login (secure for shared devices), 30-day tokens for "Remember Me" sessions (convenience for personal devices)
    *   **Frontend Integration**: Complete UI implementation with translated checkbox labels (English/Russian) and proper state management
*   **Role-Based Access Control (RBAC)**: Developed a full RBAC system (Administrator, Developer, User) that governs all API actions with proper middleware implementation.
*   **CRUD API for Datasets**: Built a full CRUD API (`/api/datasets`) that respects RBAC rules for creating, reading, updating, and deleting datasets. The API properly handles user relations and authorization for private datasets. Enhanced with comprehensive statistics endpoint (`/api/datasets/:id/statistics`) providing:
    *   **Resolution Distribution Analytics**: Server-side calculation of image resolution statistics with percentage breakdowns and frequency sorting
    *   **Training Compatibility Analysis**: Automatic validation for neural network training requirements (64px divisibility check)
    *   **Prompt Length Metrics**: Average prompt length calculation for text-to-image dataset analysis
    *   **Performance Optimization**: Efficient database queries with proper error handling and access control
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
*   **Enhanced Authentication Architecture**: Robust authentication system with advanced JWT management and session persistence:
    *   **Centralized Auth Context**: Single source of truth for user authentication state across all components using React Context
    *   **Automatic Token Management**: Axios interceptors automatically handle JWT token injection and intelligent refresh cycles that preserve original expiration times
    *   **Remember Me Functionality**: Complete implementation of long-term session support with user-controlled token lifetime (1 hour for standard login, 30 days with "Remember Me" checkbox)
    *   **Smart Token Refresh**: Sophisticated middleware that regenerates tokens on every API request while maintaining the original expiration timestamp, ensuring "Remember Me" sessions persist correctly
    *   **Smart Error Handling**: Automatic logout and redirect on authentication failures with proper error messaging
    *   **Session Persistence**: Secure token storage with automatic expiration handling, validation, and seamless synchronization between backend refresh and frontend storage
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
    *   **Comprehensive Statistics Dashboard**: Advanced analytics system with real-time computation:
        *   **Resolution Distribution Analysis**: Automatic calculation of image resolution statistics with percentage breakdowns, sorted by frequency
        *   **Interactive Statistics Display**: Expandable resolution lists with progress bars, showing top 5 resolutions by default with clickable expansion for full data
        *   **Training Compatibility Validation**: Automatic neural network training compatibility check (64px divisibility validation) with visual indicators
        *   **Prompt Length Analytics**: Average prompt length calculation for text-to-image datasets with real-time updates
        *   **Smart Visual Feedback**: Color-coded compatibility warnings (yellow) and success messages (green) for training readiness
        *   **Performance Optimized**: Statistics computed server-side with efficient database queries and cached results
    *   **Upload Integration**: Seamless CSV upload functionality directly integrated into the dataset card with automatic statistics refresh
    *   **Privacy Indicators**: Clear visual indicators for public/private dataset status with appropriate icons
*   **Enhanced Data Studio Interface**: Improved data visualization and interaction system with advanced performance optimization:
    *   **Optimized Table Layout**: Professional data table with proper column sizing and sticky headers
    *   **Advanced Image Previews**: Interactive image thumbnails with modal dialogs for detailed inspection
    *   **Smart Aspect Ratio Display**: Intelligent aspect ratio calculation with standard format detection
    *   **Scrollable Content Area**: Properly implemented scrolling with persistent pagination controls
    *   **Lazy Loading System**: Comprehensive image lazy loading architecture for handling 100+ images efficiently:
        *   Custom LazyImage component with Intersection Observer API for viewport-based loading
        *   Intelligent pre-loading with 50px buffer zone for smooth scrolling experience
        *   Animated skeleton placeholders providing visual feedback during image load
        *   Native browser lazy loading integration for additional optimization
        *   Smooth CSS transitions for graceful image appearance
        *   Performance optimized to overcome browser connection throttling limitations
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

*   **Granular Permissions System**: Revolutionary permission management architecture inspired by MediaWiki:
    *   **Permission Entities**: Flexible permissions system with separate Permission entity supporting unlimited permission types
    *   **Many-to-Many Relationships**: User-Permission associations stored in dedicated junction table with proper foreign key constraints
    *   **Built-in Permissions**: Comprehensive permission set including `edit_caption` for dataset caption editing and discussion permissions (`read_discussions`, `create_discussions`, `reply_to_discussions`, `edit_own_posts`, `edit_all_posts`, `delete_discussions`)
    *   **Default User Permissions**: Automatic assignment of base permissions during user registration:
        *   `read_discussions` - View discussions and posts (granted to all authenticated users by default)
        *   `create_discussions` - Create new discussion threads (granted to all authenticated users by default)
        *   `reply_to_discussions` - Reply to discussions (granted to all authenticated users by default)
        *   `edit_own_posts` - Edit their own discussion posts (granted to all authenticated users by default)
    *   **Registration Integration**: Backend auth system automatically grants default permissions to new users during registration process with proper database persistence
    *   **Migration Support**: Dedicated migration (`1757900000000-GrantDefaultPermissions`) for retroactive assignment of default permissions to existing users
    *   **Administrator Override**: Administrators automatically inherit all permissions without explicit grants for streamlined management
    *   **API Endpoints**: Comprehensive REST API for permission management (`/api/permissions/*`) with grant/revoke operations
    *   **Permission Middleware**: Backend middleware for fine-grained access control validation with automatic admin bypass
    *   **Enhanced Admin Interface**: Dedicated permissions management tab in admin panel with intelligent UI:
        *   **Dynamic Status Display**: Real-time status indicators showing "Granted" (green badge) or "Not Granted" (gray badge) for each permission
        *   **Context-Aware Actions**: Automatically displays "Grant" button for unassigned permissions and "Revoke" button for assigned permissions
        *   **Loading States**: Visual feedback during permission operations preventing duplicate actions
        *   **Live Updates**: Instant UI refresh after grant/revoke operations maintaining dialog state
        *   **Admin Protection**: Administrators cannot revoke their own permissions to prevent system lockouts
        *   **Hover Effects**: Enhanced visual feedback for better user experience
*   **Advanced Caption Editing System**: Professional-grade caption modification functionality with complete audit trail:
    *   **Inline Caption Editor**: React component with textarea, character count, keyboard shortcuts (Ctrl+Enter to save, Esc to cancel)
    *   **Edit Button**: Contextual edit button displayed in image detail modal only for users with `edit_caption` permission
    *   **Caption History Tracking**: Complete revision history stored in `caption_edit_history` table with timestamps and user attribution
    *   **MediaWiki-Style Diff Viewer**: Visual diff display with color-coded additions (green) and deletions (red) showing word-level changes
    *   **History List Component**: Expandable revision history with relative timestamps ("2 hours ago") and click-to-expand diff viewing
    *   **Real-time Updates**: Automatic UI refresh after caption edits with immediate reflection in dataset view
    *   **Access Control Integration**: Permission checks on both frontend (UI visibility) and backend (API validation)
    *   **Audit Trail**: All caption modifications logged with user ID, old/new values, and timestamps for compliance and accountability
    *   **Full Localization**: Complete i18n support for all UI components (English/Russian) including editor, history list, and diff viewer
*   **User Edit History System**: MediaWiki-inspired user contribution tracking system for transparency and accountability:
    *   **User Profile Edits Tab**: Dedicated tab in user profiles (`/users/:username?tab=edits`) displaying all caption edits made by the user
    *   **Backend API Endpoint**: RESTful API endpoint (`GET /api/users/:id/edits`) with pagination support (page, limit parameters)
    *   **Comprehensive Edit Display**: Each edit shows dataset name, image key (UUID), timestamp with relative formatting, and diff preview
    *   **Expandable Diff Viewer**: Click-to-expand interface showing full MediaWiki-style color-coded differences between old and new captions
    *   **Pagination Support**: Efficient pagination with configurable items per page (default 20, max 100) and proper page navigation
    *   **Deep Linking**: Direct links from edits to specific datasets and Data Studio views for context
    *   **TypeScript Type Safety**: Full type definitions for UserEdit interface and PaginatedResponse generic type
*   **Recent Changes System**: Global activity monitoring inspired by MediaWiki's Recent Changes for community transparency:
    *   **Dedicated Page**: Standalone page (`/recent-changes`) accessible from Community navigation menu showing site-wide caption edits
    *   **Backend API Endpoint**: Global endpoint (`GET /api/recent-changes`) aggregating edits from all users with pagination
    *   **Rich Metadata Display**: Shows editor username, dataset name, dataset owner, image key, and relative timestamps for each change
    *   **Advanced Query Joins**: Efficient database queries with proper join operations to User, DatasetImage, and Dataset entities
    *   **Activity Timeline**: Chronologically ordered list of edits (newest first) with expandable diff viewers
    *   **User Attribution**: Clear attribution showing "User edited Dataset" with clickable links to both user profiles and datasets
    *   **Navigation Integration**: Prominent placement in Community menu with descriptive subtitle about tracking caption edits
    *   **Performance Optimization**: Server-side pagination limiting results to 50 per page for optimal performance
    *   **Complete Localization**: Full i18n support with relative time formatting ("2 hours ago", "3 days ago") in English and Russian

### 5.8. Discussion System (Fully Implemented)

*   **Backend Infrastructure (Fully Implemented)**: Complete discussion system infrastructure with robust database schema and API endpoints:
    *   **Entity Architecture**: Three TypeORM entities (`Discussion`, `DiscussionPost`, `DiscussionEditHistory`) with proper foreign key relationships using UUID for users/datasets and auto-increment IDs for discussions/posts
    *   **Database Schema**: MariaDB tables with proper indexes on frequently queried fields (dataset_id, author_id, created_at), cascading deletes for data integrity, and soft delete support for posts
    *   **Comprehensive API**: RESTful endpoints covering full CRUD operations:
        *   `GET /api/datasets/:id/discussions` - List all discussions for a dataset
        *   `POST /api/datasets/:id/discussions` - Create new discussion with initial post
        *   `GET /api/discussions/:id` - Get single discussion with all posts and replies
        *   `POST /api/discussions/:id/posts` - Add reply to discussion
        *   `PATCH /api/posts/:id` - Edit post with automatic history tracking
        *   `GET /api/posts/:id/history` - Retrieve post edit history
        *   `DELETE /api/discussions/:id` - Delete discussion (admin only)
        *   `DELETE /api/posts/:id` - Soft delete post
        *   `PATCH /api/discussions/:id/lock` - Lock/unlock discussion
        *   `PATCH /api/discussions/:id/pin` - Pin/unpin discussion
    *   **Permission System**: Six granular permissions integrated into existing permission framework:
        *   `read_discussions` - Read discussions and posts (default: all users)
        *   `create_discussions` - Create new discussion threads (default: authenticated users)
        *   `reply_to_discussions` - Reply to discussions (default: authenticated users)
        *   `edit_own_posts` - Edit own posts (default: authenticated users)
        *   `edit_all_posts` - Edit any post (default: administrators only)
        *   `delete_discussions` - Delete threads and posts (default: administrators only)
    *   **Middleware Protection**: Custom `checkDiscussionPermission` middleware with automatic administrator bypass and granular access control
    *   **Recent Changes Integration (Backend)**: Extended Recent Changes API to aggregate discussion activity alongside caption edits:
        *   Support for four activity types: `caption_edit`, `discussion_created`, `discussion_post`, `post_edit`
        *   Unified change interface with proper timestamps and user attribution
        *   Efficient database queries with proper joins to related entities
    *   **User Activity Tracking (Backend)**: Extended User Edits API to include discussion contributions in user profiles

*   **Frontend Implementation (Fully Functional)**: Complete UI components for full discussion interaction:
    *   **DiscussionList Component**: Card-based list with visual highlighting for pinned discussions (accent background and primary border), metadata display including post count and last activity, empty state with call-to-action, and smooth navigation
    *   **CreateDiscussionDialog Component**: Modal dialog for creating discussions with title and initial post content, full validation, loading states, and error handling
    *   **DiscussionThread Component**: Full thread view with back navigation, all posts in chronological order, inline editing with PostEditor integration, reply functionality with quotations, and professional AlertDialog confirmations for deletion operations
    *   **DiscussionPostComponent**: Individual post display with clickable usernames linking to profiles, visual highlighting for thread starter's first post (accent background), timestamp with relative time formatting, reply quotation support, full edit/delete functionality, and expandable edit history viewer
    *   **PostEditor Component**: Rich text editor for posts with reply quotation display, character count, keyboard shortcuts (Ctrl+Enter to submit, Esc to cancel), and submit/cancel actions
    *   **PostEditHistory Component**: Complete edit history viewer with expandable diff display using MediaWiki-style color-coded changes, showing editor attribution and relative timestamps
    *   **Navigation Integration**: URL-based navigation with discussion parameter support (`?discussion=123`), seamless switching between list and thread views, proper state management with React Router, and automatic data refresh
    *   **Moderation Tools**: Full admin moderation interface with Lock/Pin/Delete functionality using modern AlertDialog confirmations instead of browser prompts, visual indicators for locked and pinned discussions
    *   **Activity Integration**: Complete integration with Recent Changes and User Edits pages, displaying all discussion activity types with clickable links directly to specific discussions
    *   **Permission System**: Automatic permission checking with admin panel integration for managing discussion permissions

*   **Like System (Fully Implemented)**:
    *   **Dataset Likes**: Complete like system for datasets with visual feedback and user attribution:
        *   Compact display with overlapping avatars (GitHub/Telegram style) showing first 5 users
        *   Heart icon with smooth animations (bounce effect on click, fill transition)
        *   Modal dialog with full list of users who liked, timestamps, and email addresses
        *   Backend validation preventing duplicate likes
        *   Real-time counter updates with optimistic UI
        *   Anonymous user support (view-only mode with login prompt)
    *   **Post Likes**: Like system for discussion posts with same UX patterns:
        *   Smaller, compact display suitable for posts (3 avatars max)
        *   Self-like prevention on both backend (validation) and frontend (UI disabled)
        *   Integrated into DiscussionPostComponent with automatic data refresh
        *   Post-specific like counts visible to all users
        *   Separate API endpoints (`/api/posts/:id/likes`) with full CRUD operations
    *   **Database Design**:
        *   `likes` table for dataset likes (userId + datasetId unique constraint)
        *   `post_likes` table for post likes (userId + postId unique constraint)
        *   Cascading deletes maintaining data integrity
        *   Indexed foreign keys for optimal query performance
    *   **Community Statistics**:
        *   Real-time like counts displayed in Community tab
        *   Click-to-expand dialogs showing all contributors
        *   Automatic contributor fetching on page load (no manual refresh needed)
        *   Contributors sorted by total activity (discussions + posts)
        *   Discussion count and post count statistics per user
        
*   **Features NOT Yet Implemented** (Future Enhancements):
    *   **Real-time Updates**: No WebSocket or polling for live discussion updates
    *   **Rich Text Formatting**: Plain text only, no markdown/formatting support
    *   **Notifications**: No notification system for replies or mentions
    *   **Search**: No search functionality within discussions
    *   **Moderation Queue**: No moderation tools for flagged content
    *   **Discussion Categories/Tags**: No organization system beyond pinning
    *   **Voting System**: No upvote/downvote for posts (only likes)
    *   **File Attachments**: No support for attaching files to posts

*   **Technical Implementation Details**:
    *   **Type Safety**: Complete TypeScript type definitions for all discussion entities with proper UUID/number type handling
    *   **Localization**: Full i18n support for all discussion UI elements in English and Russian
    *   **Error Handling**: Comprehensive error handling with user-friendly toast notifications
    *   **Responsive Design**: Mobile-friendly UI with adaptive layouts using Tailwind CSS
    *   **Performance**: Efficient database queries with proper indexing and relation loading
    *   **URL State Management**: Deep linking support with discussion IDs in URL parameters
    *   **Visual Feedback**: Conditional rendering preventing React's "0" output bug, proper loading states, and smooth transitions
    *   **User Experience**: Clickable usernames throughout, visual distinction for pinned discussions and thread starters, modern AlertDialog components for all confirmations

---

## Document Version History

*Latest Update: October 2025 - Dataset Update Smart Logic Implementation: Resolved critical data integrity issue where image_key (UUID identifiers) were regenerated on every CSV upload, breaking stable image tracking across dataset updates. Implemented intelligent "Smart Update" algorithm in upload endpoint (`POST /api/datasets/:id/upload`) that matches incoming CSV rows with existing database records by URL (primary matching criterion) or img_key from CSV (if provided), preserving original image_key and database ID for existing images while only assigning new UUIDs to genuinely new images. Enhanced upload response with detailed statistics tracking (total, updated, new, deleted image counts) for complete transparency. System now automatically removes images no longer present in updated CSV for data consistency. Updated PROJECT_CONSTITUTION.md documentation to reflect new upload behavior replacing "Overwrite on Upload" with comprehensive "Smart Update on Upload" section. This improvement ensures stable image identifiers essential for caption edit history tracking, discussion system integrity, and maintaining data consistency across the entire application.*

*October 2025 - Personalized Theme System Implementation: Deployed comprehensive user settings system with database-persisted theme preferences. Implemented per-user theme storage in `users.theme` column eliminating cross-user conflicts from browser localStorage. Created migration (`1757950000000-AddUserTheme`) adding theme column with three options (light/dark/system). Developed complete theme infrastructure: centralized ThemeContext with automatic server synchronization, hybrid storage approach (authenticated users get database persistence, anonymous users use localStorage fallback), dedicated REST API endpoints (`GET/PATCH /api/users/me/settings`) for preferences management. Enhanced CSS architecture with professional dark theme inspired by GitHub Dark, Discord, and VS Code featuring carefully balanced contrast ratios and HSL-based color variables for smooth transitions. Built modern SettingsDialog component with intuitive theme selection interface, visual theme previews with icons, and extensible architecture for future settings. Fixed critical provider hierarchy issue where ThemeProvider was positioned above AuthProvider causing "useAuth must be used within AuthProvider" error. System now provides true personalized theming where each user's theme preference persists across devices and browser sessions independently.*

*October 2025 - Permission System Enhancement: Resolved critical issue where default user permissions were not physically assigned in database during registration, causing admin panel to incorrectly display "Not Granted" for all permissions. Implemented automatic default permission assignment during user registration for four base permissions (read_discussions, create_discussions, reply_to_discussions, edit_own_posts) with proper database persistence. Created retroactive migration (`1757900000000-GrantDefaultPermissions`) to grant default permissions to existing users who registered before this fix. Enhanced admin panel permissions interface with dynamic status display showing real-time "Granted"/"Not Granted" badges, context-aware Grant/Revoke buttons that automatically switch based on current permission state, loading states during operations, and live UI updates maintaining dialog state after permission changes. Fixed permission synchronization bug where dialog state wasn't updating after grant/revoke operations. System now properly distinguishes between administrator automatic permissions and user-specific grants with appropriate UI indicators and hover effects for improved user experience.*

*October 2025 - Community Engagement & Like System: Implemented comprehensive like system for both datasets and discussion posts with GitHub/Telegram-style UI featuring compact avatar displays, smooth animations, and detailed modal dialogs. Deployed complete backend with two database tables (`likes`, `post_likes`) using unique constraints and cascading deletes for data integrity. Added six new API endpoints for CRUD operations on likes with proper validation including self-like prevention. Enhanced Community tab with real-time statistics: discussion count, contributor list with activity metrics (threads created + posts written), and like visualization with user attribution. Fixed contributors loading bug ensuring statistics display immediately on page load. Frontend features include PostLikesDisplay component with animations, LikesDisplay component for datasets, ContributorsDialog with detailed user activity breakdown, and seamless integration into DiscussionPostComponent. All components fully localized in English and Russian with comprehensive toast notifications for user feedback.*

*October 2025 - Discussion System Completion: Finalized comprehensive discussion system with complete end-to-end functionality. All frontend features now fully operational including post editing with inline editor, PostEditHistory component with expandable MediaWiki-style diffs, full admin moderation tools (Lock/Pin/Delete) with modern AlertDialog confirmations replacing browser prompts, complete Recent Changes and User Edits integration showing all discussion activity with deep links to specific discussions, admin panel integration for permission management, URL-based navigation with discussion parameter support, visual enhancements including highlighted pinned discussions and thread starter posts, clickable usernames linking to profiles throughout the system, and bug fixes addressing React conditional rendering issues. System now production-ready with comprehensive functionality matching project requirements.*

*January 2025 - Discussion System Implementation: Deployed comprehensive discussion system with complete backend infrastructure including three TypeORM entities (Discussion, DiscussionPost, DiscussionEditHistory), full RESTful API with 10 endpoints covering CRUD operations, granular permission system with six distinct permissions integrated into existing framework, custom middleware for access control, and extended Recent Changes/User Edits APIs to track discussion activity. Frontend implementation includes five core components (DiscussionList, CreateDiscussionDialog, DiscussionThread, DiscussionPostComponent, PostEditor) providing basic discussion functionality with create, view, and reply capabilities. System features nested replies with quotations, soft delete support, lock/pin functionality (backend ready), complete internationalization, and responsive design.*

*October 2025 - User Edit History & Recent Changes System: Implemented MediaWiki-inspired contribution tracking and global activity monitoring for complete transparency and accountability. Deployed User Edit History system with dedicated profile tab showing all user caption edits with pagination, expandable diff viewers, and deep linking to datasets. Created Recent Changes page accessible from Community menu for site-wide edit monitoring with rich metadata display including editor, dataset owner, timestamps, and expandable diffs. Backend includes two new API endpoints (`/api/users/:id/edits` and `/api/recent-changes`) with efficient database queries using proper joins to User, DatasetImage, and Dataset entities. Frontend features new UserEditsTab component integrated into user profiles with URL state management, standalone RecentChanges page with comprehensive filtering, lazy-loaded routes for performance, and complete localization in English and Russian with relative time formatting. System provides full audit trail visibility for community-driven caption improvements.*

*October 2025 - Granular Permissions System & Advanced Caption Editing: Implemented comprehensive permission management system inspired by MediaWiki with flexible Permission entity supporting unlimited permission types, many-to-many user-permission relationships, administrator override capabilities, and dedicated admin interface with full localization. Deployed professional caption editing functionality with inline editor, MediaWiki-style diff viewer with color-coded changes, complete revision history tracking, expandable history list component, and full audit trail. Backend includes permission middleware for access control, API endpoints for permission management, and caption edit history storage with proper foreign key constraints. Frontend features contextual edit buttons, character count, keyboard shortcuts, real-time UI updates, permission-based UI visibility, and complete internationalization support for all new components (CaptionEditor, CaptionHistoryList, DiffViewer) in English and Russian languages.*

*October 2025 - Image Loading Performance Optimization: Resolved critical image loading performance issue in Data Studio when displaying 100+ images. Implemented comprehensive lazy loading system using Intersection Observer API with custom LazyImage component, viewport buffering (50px), native browser lazy loading integration, animated skeleton placeholders, and smooth CSS transitions. System now efficiently handles large datasets without browser connection throttling issues, providing smooth progressive loading during scrolling.*

*January 2025 - Session Persistence & Remember Me Implementation: Resolved critical session management bug and implemented comprehensive "Remember Me" functionality with flexible token expiration (1 hour standard, 30 days with Remember Me), intelligent token refresh middleware that preserves original expiration timestamps, complete frontend integration with checkbox control, and seamless synchronization between backend token generation and frontend storage. Enhanced authentication architecture documentation with detailed token management flows and session persistence mechanisms.*

*January 2025 - Advanced Dataset Analytics Implementation: Deployed comprehensive dataset statistics system featuring real-time resolution distribution analysis with interactive expandable displays, automatic neural network training compatibility validation (64px divisibility check), prompt length analytics for text-to-image datasets, server-side performance optimization with efficient database queries, and color-coded visual feedback system. Enhanced Dataset Card component with professional statistics dashboard, progress bars, and seamless integration with CSV upload workflow for automatic statistics refresh.*

*January 2025 - Revolutionary Dataset Page Architecture: Implemented comprehensive tabbed interface system for dataset pages with four distinct sections (Dataset Card, Data Studio, Files and versions, Community), complete file management system with CSV storage and download functionality, enhanced data visualization with scrollable content areas and sticky pagination, URL state management for deep linking with tab parameters, and modular component architecture ready for future community features*

*January 2025 - Administrative Panel Implementation: Added comprehensive admin panel with complete user and dataset management capabilities, enhanced authentication architecture with centralized JWT management and axios interceptors, democratized dataset creation for all authenticated users, resolved critical authentication bugs and URL duplication issues, implemented centralized authentication context for consistent user state management across all components*

*January 2025 - Major feature expansion including comprehensive internationalization system with localization bug fixes, enhanced user management with role-based filtering, advanced three-tab dataset discovery system, performance optimization with lazy loading, and revolutionary navigation architecture with complete user role coverage*

*December 2024 - Added Modern Interface Enhancements including sticky layout system and improved UX patterns*