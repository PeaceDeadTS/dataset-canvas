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

*   **Framework**: Express.js provides the routing and middleware structure.
*   **Database**: MariaDB is used as the relational database. The system supports connections via both TCP/IP and more secure Unix sockets.
*   **ORM**: TypeORM manages database connections, entity definitions, and queries. The application relies on a **globally available database connection** and consistently uses the `getManager()` function to retrieve entity repositories. This architectural pattern is key to the testing strategy: the test setup script (`test-setup.ts`) establishes a global connection to an isolated test database *before* any tests run, allowing the application code to operate identically in both test and production environments without needing modification.
*   **Entities**:
    *   `User`: Stores user information, including `username`, `email`, hashed `password`, and `role`.
    *   `Dataset`: Represents a dataset "container," with properties like `name`, `description`, `isPublic`, and relationships to its owner (`user`) and its images.
    *   `DatasetImage`: Stores metadata for each image within a dataset, including `url`, `filename`, and `prompt`.
*   **API**: A RESTful API is exposed under `/api` for all frontend-backend communication.
*   **Test-Safe Entry Point**: The main application entry point (`src/index.ts`) is structured to prevent side effects (like automatic database connections) during testing. The server startup and database connection logic are encapsulated in an exported function that is only called when the application is run directly, not when its modules are imported by test files.
*   **Data Integrity**:
    *   **Cascading Deletes**: The relationship between `Dataset` and `DatasetImage` is configured with `onDelete: 'CASCADE'`. This ensures that when a dataset is deleted, all its associated image records are automatically removed, preventing orphaned data.
    *   **Overwrite on Upload**: The CSV upload endpoint (`POST /api/datasets/:id/upload`) operates in an "overwrite" mode. It first deletes all existing images in a dataset before inserting the new records, simplifying data updates.

### 2.2. Authentication & Authorization

*   **Mechanism**: Authentication is handled via JWT. Upon successful login, the server issues a token which the client stores in `localStorage` and includes in the `Authorization` header.
*   **Role-Based Access Control (RBAC)**: The system defines three user roles:
    1.  `Administrator`: Full control over all users and datasets.
    2.  `Developer`: Can create datasets and manage their own.
    3.  `User`: Can view public datasets.
*   **Special Rule**: The very first user to register in the system is automatically granted the `Administrator` role.

### 2.3. Frontend Architecture

*   **Framework**: Built with React and Vite for a fast development experience.
*   **Styling**: Utilizes Tailwind CSS for utility-first styling, with `shadcn/ui` for a pre-built, accessible component library.
*   **State Management**: Global user state is managed via a custom `useAuth` hook that decodes the JWT. Component-level state is managed with `useState`.
*   **Routing**: `react-router-dom` is used for client-side routing.

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

## 4. Key Implemented Features

This section provides a summary of the core features implemented in the application.

*   **Full User Authentication**: Implemented complete user registration and login flow (`/api/auth/register`, `/api/auth/login`) using JWT and password hashing (`bcrypt`).
*   **Role-Based Access Control (RBAC)**: Developed a full RBAC system (Administrator, Developer, User) that governs all API actions.
*   **CRUD API for Datasets**: Built a full CRUD API (`/api/datasets`) that respects RBAC rules for creating, reading, updating, and deleting datasets.
*   **Dataset List & Creation UI**: The frontend displays a list of visible datasets. Authenticated Admins and Developers have access to a "Create Dataset" dialog.
*   **CSV Data Upload**: Implemented a `multer` and `csv-parser` pipeline on the backend (`POST /api/datasets/:id/upload`) to allow authorized users to upload image metadata via CSV files.
*   **Dataset Details Page**: Created a dynamic route (`/datasets/:id`) and page that displays detailed information and all images for a selected dataset.
*   **Image Pagination**: The dataset details page includes a pagination component to handle and navigate large numbers of images efficiently.
*   **Client-Side Auth Handling**: A custom `useAuth` hook decodes the JWT stored in `localStorage` to provide user information (ID, role) throughout the frontend application.