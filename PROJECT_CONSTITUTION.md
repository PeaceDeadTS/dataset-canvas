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

## 3. Development Log

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
