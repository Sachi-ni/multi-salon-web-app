# Multi-Salon Web App

A comprehensive platform designed to manage multiple salons, handle customer bookings, and streamline operations for salon administrators, managers, and staff.

## 🚀 Features

### Customer Portal
*   **Discover Salons:** Browse available salons and view their services, staff, and details.
*   **Book Appointments:** Easy-to-use booking system to schedule appointments with specific staff for desired services.
*   **Profile Management:** Customers can securely manage their personal information and view past/upcoming appointments.
*   **Feedback & Reviews:** Customers can leave feedback for the services they received.

### Admin & Staff Dashboards
*   **Super Admin Control:** Full visibility and control over all registered salons, staff, and platform-wide revenue and analytics.
*   **Salon Management:** Add, edit, and manage individual salons, their operating hours, and location details.
*   **Service & Staff Management:** Configure services, prices, durations, and manage staff schedules and roles.
*   **Appointment Tracking:** View daily and weekly appointment schedules, manage cancellations, and track booking statuses.

## 🛠️ Technology Stack

*   **Frontend:** React, React Router, Vite, Tailwind CSS (or standard CSS), Lucide React (for icons)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB with Mongoose
*   **Authentication:** JWT (JSON Web Tokens) and bcrypt for secure password hashing

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Sachi-ni/multi-salon-web-app.git
    cd multi-salon-web-app
    ```

2.  **Backend Setup**
    Navigate to the backend directory, install dependencies, and configure environment variables.
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory and add the following variables:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    ```
    Start the backend server:
    ```bash
    npm run dev
    ```

3.  **Frontend Setup**
    Navigate to the frontend directory and install dependencies.
    ```bash
    cd ../frontend
    npm install
    ```
    Start the frontend development server:
    ```bash
    npm start
    ```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
