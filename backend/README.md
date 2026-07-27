# MERN Stack Project - Backend

This is the backend server for the Multi-Salon Web App, built using Node.js, Express, and MongoDB. It provides a robust RESTful API to manage salons, appointments, users (customers, staff, admins), services, and billing.

## 🚀 Tech Stack
- **Node.js & Express.js** (Server Framework)
- **MongoDB & Mongoose** (Database & ODM)
- **JSON Web Token (JWT)** (Authentication)
- **Bcrypt.js** (Password Hashing)
- **Multer** (File Uploads)

## 📁 Project Structure

```text
backend/
├── config/                 # Configuration files (Database connection)
├── controllers/            # Request handlers for various API endpoints
├── middleware/             # Custom Express middlewares (Auth, Role checks)
├── models/                 # Mongoose database schemas and models
├── routes/                 # API route definitions and controller mapping
├── uploads/                # Directory for locally uploaded assets
├── utils/                  # Utility functions (Token generation, etc.)
├── check_*.js / test_*.js  # Various testing and debugging scripts
├── server.js               # Main entry point for the Express server
├── .env                    # Environment variables (Git ignored)
└── package.json            # Project dependencies and scripts
```

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 2. Installation
Navigate to the backend folder and install the necessary dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of the `backend` directory and add the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 4. Running the Server
Start the development server with Nodemon (auto-reloads on changes):
```bash
npm run dev
```
Or start the server normally:
```bash
npm start
```

## 🔒 Authentication & Roles
The API uses JWT for authentication. It supports multiple roles seamlessly via middleware:
- `super-admin`: Complete system access.
- `manager` / `staff-admin`: Salon-specific administrative access.
- `staff`: Access to assigned schedules and appointments.
- `customer`: Access to booking and personal profiles.
