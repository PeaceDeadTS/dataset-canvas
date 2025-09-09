# Dataset Canvas

Dataset Canvas is a web application inspired by Hugging Face's Data Studio, designed for easier dataset management and visualization. This project provides a custom solution for managing datasets, complete with user authentication, role-based access control, and a clean user interface.

## Features (Current)

- **User Authentication**: Secure user registration and login functionality.
- **Role-Based Access Control**:
  - **Administrator**: Full control over all datasets and users.
  - **Developer**: Can create new datasets and manage their own, with read-only access to others.
  - **User**: Can view and download public datasets.
- **Dataset Management**:
  - Create, read, update, and delete datasets (CRUD).
  - Support for **public** and **private** datasets. Private datasets are only visible to their owner and administrators.
- **Backend API**: A robust backend built with Node.js, Express, and TypeORM.
- **Modern Frontend**: A responsive frontend built with React, Vite, TypeScript, and shadcn/ui.

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/)
- A running [MariaDB](https://mariadb.org/) or MySQL database instance.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/PeaceDeadTS/dataset-canvas.git
    cd dataset-canvas
    ```

2.  **Setup the Backend:**
    ```sh
    # Navigate to the backend directory
    cd backend

    # Install dependencies
    npm install

    # Create an environment file
    # You need to create a .env file in the `backend` directory.
    # Copy the example below and fill in your database credentials.
    ```
    Create a file named `.env` in the `backend` folder with the following content:
    ```env
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=your_username
    DB_PASSWORD=your_password
    DB_DATABASE=your_database_name
    JWT_SECRET=your_super_secret_jwt_key
    ```
    - The first user to register will automatically be granted the `Administrator` role.

3.  **Setup the Frontend:**
    ```sh
    # Navigate back to the root directory
    cd ..

    # Install dependencies
    npm install
    ```

### Running the Application

You need to run both the backend and frontend servers simultaneously in separate terminals.

1.  **Start the Backend Server:**
    ```sh
    # In the `backend` directory
    npm start
    ```
    The backend server will start on `http://localhost:5000` by default.

2.  **Start the Frontend Development Server:**
    ```sh
    # In the root project directory
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Technology Stack

- **Backend**:
  - Node.js
  - Express.js
  - TypeScript
  - TypeORM (for MariaDB/MySQL)
  - JWT for authentication
- **Frontend**:
  - Vite
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
