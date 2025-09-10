# Project Constitution: Dataset Canvas

## 1. Project Overview

**Dataset Canvas** is a web application designed as a custom-built clone of Hugging Face's Data Studio. Its primary purpose is to provide a platform for managing, visualizing, and interacting with image datasets. The application supports user authentication, role-based access control, and allows authorized users to create datasets and upload image information via CSV files.

The project is architected with a distinct frontend and backend.

### Technology Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Axios, `react-router-dom`.
*   **Backend**: Node.js, Express, TypeScript, TypeORM, MariaDB.
*   **Authentication**: JSON Web Tokens (JWT).
*   **Development**: Bun (as a runtime/package manager), ESLint, Vitest.

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
    *   `Dataset`: Represents a dataset "container," with properties like `name`, `description`, `isPublic`, and relationships to its owner (`user`) and its images. Includes a computed `imageCount` field populated via TypeORM's `loadRelationCountAndMap` for efficient display of total image counts.
    *   `DatasetImage`: Stores metadata for each image within a dataset, including `url`, `filename`, `width`, `height`, and `prompt`.
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
    1.  `Administrator`: Full control over all users and datasets, including private datasets of other users
    2.  `Developer`: Can create datasets and manage their own (both public and private)
    3.  `User`: Can view public datasets only
*   **Dataset Visibility Rules**:
    *   **Public datasets**: Visible to all users (authenticated and anonymous)
    *   **Private datasets**: Only visible to the dataset owner and administrators
    *   **Anonymous users**: Can only see public datasets
    *   **Authenticated users**: See all public datasets + their own private datasets
*   **Special Rule**: The very first user to register in the system is automatically granted the `Administrator` role.

### 2.3. Frontend Architecture

*   **Framework**: Built with React and Vite for a fast development experience.
*   **Styling**: Utilizes Tailwind CSS for utility-first styling, with `shadcn/ui` for a pre-built, accessible component library.
*   **State Management**: Global user state is managed via a custom `useAuth` hook that decodes the JWT with proper token validation and expiration handling. Component-level state is managed with `useState`. The auth state properly synchronizes with dataset visibility logic.
*   **Routing**: `react-router-dom` is used for client-side routing.
*   **Shared Types**: To ensure consistency and prevent data-related bugs, the frontend uses a centralized file for shared TypeScript types (`src/types/index.ts`). All major data structures, like `User` and `Dataset`, are defined here and imported throughout the application.

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
*   **Fixed Layout Structure**: Improved dataset page layout by implementing a sticky header/footer design where the DatasetHeader, dataset card, and pagination remain fixed while only the image table scrolls. This provides better navigation control and constant access to pagination without scrolling.

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
    *   **Fixed Layout Structure**: Sticky header/footer design with DatasetHeader, dataset card, and pagination always visible while the image table scrolls independently, improving navigation control and user experience
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