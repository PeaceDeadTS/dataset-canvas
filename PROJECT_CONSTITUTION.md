# Project Constitution: Dataset Canvas

## 1. Project Overview

**Dataset Canvas** is a web application designed as a custom-built clone of Hugging Face's Data Studio. Its primary purpose is to provide a platform for managing, visualizing, and interacting with image datasets. The application supports user authentication, role-based access control, and allows authorized users to create datasets and upload image information via CSV files.

The project is architected with a distinct frontend and backend.

### Technology Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Axios, `react-router-dom`.
*   **Backend**: Node.js, Express, TypeScript, TypeORM, MariaDB.
*   **Authentication**: JSON Web Tokens (JWT).
*   **Development**: Bun (as a runtime/package manager), ESLint.

---

## 2. Key Architectural Decisions & Features

### 2.1. Backend Architecture

*   **Framework**: Express.js provides the routing and middleware structure.
*   **Database**: MariaDB is used as the relational database.
*   **ORM**: TypeORM manages database connections, entity definitions, and queries, providing a strong link between the TypeScript code and the database schema.
*   **Entities**:
    *   `User`: Stores user information, including `username`, `email`, hashed `password`, and `role`.
    *   `Dataset`: Represents a dataset "container," with properties like `name`, `description`, `isPublic`, and a relationship to its owner (`user`).
    *   `DatasetImage`: Stores metadata for each image within a dataset, including `url`, `filename`, `dimensions`, `prompt`, and a relationship back to its `dataset`. It features an auto-generated `img_key` (UUID) and `row_number`.
*   **API**: A RESTful API is exposed under `/api`. All communication between the frontend and backend happens through this API.

### 2.2. Authentication & Authorization

*   **Mechanism**: Authentication is handled via JWT. Upon successful login, the server issues a token which the client stores in `localStorage` and includes in the `Authorization` header for subsequent requests.
*   **Role-Based Access Control (RBAC)**: The system defines three user roles:
    1.  `Administrator`: Full control over all users and datasets.
    2.  `Developer`: Can create datasets and manage their own.
    3.  `User`: Can view public datasets.
*   **Special Rule**: The very first user to register in the system is automatically granted the `Administrator` role.

### 2.3. Frontend Architecture

*   **Framework**: Built with React and Vite for a fast development experience.
*   **Styling**: Utilizes Tailwind CSS for utility-first styling, with `shadcn/ui` for a pre-built, accessible component library.
*   **State Management**: Simple global state (like the authenticated user) is managed through a custom hook (`useAuth`) that decodes the JWT. Component-level state is managed with `useState`.
*   **Routing**: `react-router-dom` is used for client-side routing, with pages located in `src/pages`.

---

## 4. Testing & Debugging Strategy

To ensure the reliability and maintainability of the application, a multi-layered testing and debugging strategy has been implemented.

### 4.1. Backend Testing

*   **Framework**: **Vitest** is used as the primary test runner for its speed and modern feature set.
*   **API (Integration) Testing**: **Supertest** is used to perform integration tests on the Express API endpoints. This allows us to simulate real HTTP requests and validate responses, database interactions, and authorization logic.
*   **Test Environment**: Tests run against a **separate, isolated test database** (`dataset_canvas_test`) to prevent any impact on development data. A setup file (`src/test/test-setup.ts`) ensures the database is cleaned before each test run, guaranteeing test isolation.
*   **Running Backend Tests**:
    ```bash
    cd backend
    npm test
    ```

### 4.2. Frontend Testing

*   **Framework**: **Vitest** is also used for the frontend, providing a consistent testing experience.
*   **Component Testing**: **React Testing Library** is used to test React components. The focus is on testing component behavior from a user's perspective, ensuring that components render correctly and are interactive.
*   **Test Environment**: **JSDOM** is used to simulate a browser environment, allowing component tests to run in a Node.js process without needing a real browser.
*   **Running Frontend Tests**:
    ```bash
    # From the project root
    npm test
    npm run test:ui # For an interactive UI
    ```

### 4.3. Logging

*   **Library**: **Winston** is used on the backend for robust, configurable logging.
*   **Configuration**:
    *   Logs are output to the console during development for immediate feedback.
    *   Error-level logs are written to a dedicated `error.log` file.
    *   In non-production environments, all logs are also written to `combined.log` for detailed analysis.
    *   This setup ensures that in a production environment, we have a persistent record of errors for debugging, without cluttering the main logs.

---

## 5. Development Log

This section provides a chronological summary of the work completed in each development session.

### Session 1: Foundation & Core Features

*   **Objective**: Build the foundational features of the application from scratch.
*   **Backend Implementation**:
    *   Initialized a Node.js project with Express, TypeScript, and TypeORM.
    *   Established `User` and `Dataset` entities and connected to the MariaDB database.
    *   Implemented a full user authentication system (`/api/auth/register`, `/api/auth/login`) with password hashing (`bcrypt`) and JWT generation.
    *   Implemented the RBAC system, including the "first user is admin" rule.
    *   Developed a full CRUD API for datasets (`/api/datasets`) enforcing RBAC rules (e.g., creation restricted to Admins/Developers, modification/deletion restricted to owners/Admins).
*   **Frontend Implementation**:
    *   Created the authentication page (`/auth`) with forms for login and registration.
    *   Built the main index page (`/`) to fetch and display a list of all visible datasets, respecting the user's authentication status and role.
*   **Project Housekeeping**:
    *   Updated `.cursor/rules` to be specific to this project.
    *   Rewrote the `README.md` to provide accurate setup and run instructions.

### Session 2: Dataset Content Upload & Viewing

*   **Objective**: Enable authorized users to upload image data to their datasets and view it.
*   **Backend Implementation**:
    *   Created the `DatasetImage` entity to store image metadata.
    *   Updated the `Dataset` and `User` entities to establish the necessary relationships (`OneToMany`, `ManyToOne`).
    *   Installed and configured `multer` (for file uploads) and `csv-parser` (for processing CSV data).
    *   Created a new API endpoint `POST /api/datasets/:id/upload` to handle CSV file uploads. This endpoint parses the file, creates `DatasetImage` records, and saves them to the database.
    *   Created a new API endpoint `GET /api/datasets/:id/images` with pagination to fetch the images belonging to a specific dataset.
    *   Enhanced the `GET /api/datasets` and `GET /api/datasets/:id` endpoints to include an `imageCount` for each dataset.
*   **Frontend Implementation**:
    *   Added the `jwt-decode` library to parse JWTs on the client side.
    *   Created a custom hook, `useAuth`, to provide user information (ID, role, etc.) throughout the application from the stored JWT.
    *   On the main page, conditionally rendered a "Create Dataset" button, visible only to users with `Administrator` or `Developer` roles.
    *   Developed a `CreateDatasetDialog` component, a modal form for creating a new dataset.
    *   Created a new page component, `DatasetPage.tsx`, for viewing the details of a single dataset.
    *   Added a new route `/datasets/:id` to handle navigation to the `DatasetPage`.
    *   Implemented a UI for uploading CSV files on the `DatasetPage`, visible only to the dataset owner or an Administrator.
    *   Implemented the logic to fetch and display dataset images in a table on the `DatasetPage`, including a pagination component to navigate through large sets of images.
    *   Updated the `DatasetListItem` component to make the entire card a clickable link to the dataset's detail page.

### Session 3: Data Integrity & Management Improvements

*   **Objective**: Enhance data lifecycle management to ensure integrity and provide a smoother user experience for updating datasets.
*   **Backend Implementation**:
    *   **Cascading Deletes**: Implemented `onDelete: 'CASCADE'` for the relationship between `Dataset` and `DatasetImage`. This ensures that when a dataset is deleted, all its associated image records are automatically and efficiently removed from the database, preventing orphaned data.
    *   **Dataset Update (Overwrite) Logic**: Modified the `POST /api/datasets/:id/upload` endpoint. Instead of appending data, the endpoint now first deletes all existing image records for the specified dataset before inserting the new records from the uploaded CSV file. This changes the upload behavior from "append" to "overwrite," allowing users to easily update their datasets by uploading a new version of their CSV.

### Session 4: Testing & Reliability

*   **Objective**: Implement a comprehensive testing and logging system to improve application stability and developer confidence.
*   **Backend Implementation**:
    *   Set up the **Vitest** testing framework with **Supertest** for API integration testing.
    *   Configured a separate test database to run tests in an isolated environment.
    *   Wrote the first integration test for a critical endpoint (`POST /api/datasets`), covering both success scenarios and authorization rules.
    *   Integrated the **Winston** library for structured, file-based logging, replacing all `console.log` and `console.error` calls.
*   **Frontend Implementation**:
    *   Set up the **Vitest** testing framework with **React Testing Library** for component testing.
    *   Configured a `jsdom` environment to allow tests to run without a browser.
    *   Wrote the first component test for `DatasetListItem`, verifying correct rendering of props and link generation.
*   **Project Housekeeping**:
    *   Troubleshot and resolved several environment-specific issues related to running tests on both frontend and backend.
    *   Consolidated frontend test configuration into `vite.config.ts`.

### Session 5: Pre-Deployment Testing & Fixes

*   **Objective**: Ensure the application is ready for deployment by running the test suites and resolving any discovered issues.
*   **Backend Implementation**:
    *   Ran the backend test suite using Vitest.
    *   Encountered and resolved module resolution errors (`TypeError: ... is not a function`) related to CommonJS modules (`express`, `cors`, `multer`) being imported into an environment that expected ES Modules.
    *   Fixed the issues by changing star imports (`import * as ...`) to default imports (`import ... from ...`) in `src/index.ts` and `src/routes/datasets.ts`.
    *   Identified that backend tests require a running MariaDB instance for the test database connection.
    *   **Flexible Database Connection**: Updated the TypeORM configuration (`ormconfig.ts`) to support connecting via a Unix socket (`DB_SOCKET_PATH`). This allows for a more secure and performant connection in production environments (like Debian), while retaining the standard TCP/IP connection for local development.