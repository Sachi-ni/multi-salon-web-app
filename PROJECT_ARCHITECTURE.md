# Multi-Salon Web App: Architecture & Features Guide

This document provides a comprehensive overview of the current features in the project and traces the flow for each feature across the database, backend, and frontend. It also outlines the overall folder structure of the repository.

---

## 1. Core Features & File Traces

### 1.1 Authentication & Authorization
Manages secure login and access control for Super Admins, Salon Admins, Managers, Staff, and Customers.
* **Database Models:** `backend/models/Admin.js`, `backend/models/Customer.js`, `backend/models/Staff.js`
* **Backend Controllers:** `backend/controllers/authController.js` (for admins & staff), `backend/controllers/customerAuthController.js` (for customers)
* **Frontend Pages:** `frontend/src/pages/auth/Login.jsx`, `frontend/src/pages/auth/Register.jsx`

### 1.2 Salon Management
Allows Super Admins to create, edit, delete, and view individual salon branches, managing their operating hours and contact details.
* **Database Models:** `backend/models/Salon.js`
* **Backend Controllers:** `backend/controllers/salonController.js`
* **Frontend Pages:** `frontend/src/pages/superadmin/Salons.jsx`, `frontend/src/pages/superadmin/AddSalon.jsx`

### 1.3 Service Management
Allows defining the treatments and services offered, setting prices, durations, and assigning them to categories.
* **Database Models:** `backend/models/Service.js`, `backend/models/ServiceCategory.js`
* **Backend Controllers:** `backend/controllers/serviceController.js`
* **Frontend Pages:** `frontend/src/pages/admin/Services.jsx`, `frontend/src/pages/superadmin/Services.jsx`

### 1.4 Staff & Schedule Management
Manages employees, their roles, working hours (availabilities), assigned services, attendance, and payroll.
* **Database Models:** `backend/models/Staff.js`, `backend/models/StaffAvailability.js`, `backend/models/Salary.js`, `backend/models/Attendance.js`
* **Backend Controllers:** `backend/controllers/staffController.js`, `backend/controllers/staffAvailabilityController.js`, `backend/controllers/salaryController.js`
* **Frontend Pages:** `frontend/src/pages/admin/Staff.jsx`, `frontend/src/pages/superadmin/Staff.jsx`, `frontend/src/pages/superadmin/AddStaff.jsx`

### 1.5 Appointment Booking & Management
The core engine for booking appointments. Includes dynamic slot generation based on staff availability and collision detection (FCFS locks).
* **Database Models:** `backend/models/Appointment.js`, `backend/models/AppointmentService.js` (for handling multi-service staff assignments)
* **Backend Controllers:** `backend/controllers/appointmentController.js`
* **Frontend Pages:** 
  - Customer Flow: `frontend/src/pages/customer/BookAppointment.jsx`, `frontend/src/pages/customer/StepStaff.jsx`, `frontend/src/pages/customer/StepDateTime.jsx`
  - Admin Flow: `frontend/src/pages/admin/AddApointmnet.jsx`, `frontend/src/pages/superadmin/AddAppointment.jsx`

### 1.6 Billing & Revenue Tracking
Handles generation of invoices for completed appointments and aggregates revenue data for analytical dashboards.
* **Database Models:** `backend/models/Bill.js`
* **Backend Controllers:** `backend/controllers/billController.js`, `backend/controllers/revenueController.js`
* **Frontend Pages:** Analyzed inside Admin/Superadmin dashboard summary pages.

### 1.7 Feedback, Reviews & Notifications
Collects customer feedback on services and alerts administrators of new bookings via an internal notification system.
* **Database Models:** `backend/models/Feedback.js`, `backend/models/Review.js`, `backend/models/Notification.js`
* **Backend Controllers:** `backend/controllers/feedbackController.js`, `backend/controllers/notificationController.js`
* **Frontend Pages:** Customer landing sections and Admin notification dropdowns.

### 1.8 AI Chatbot Support
Provides automated customer support and inquiries via an integrated chat interface.
* **Backend Controllers:** `backend/controllers/chatbotController.js`

---

## 2. Project File Structure

The project is structured as a standard MERN (MongoDB, Express, React, Node.js) monolith with separated `frontend` and `backend` directories.

```text
multi-salon-web-app/
├── backend/                  # Node.js + Express backend server
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Business logic (e.g., appointmentController.js)
│   ├── middleware/           # Express middlewares (auth guarding, upload handlers)
│   ├── models/               # Mongoose DB schemas (e.g., Appointment.js, Staff.js)
│   ├── routes/               # Express API route definitions
│   ├── uploads/              # Local storage for uploaded assets (images, etc)
│   ├── index.js              # Main backend entry point
│   └── seed.js               # Database seeding script for dummy data
│
├── frontend/                 # React.js + Vite frontend application
│   ├── public/               # Static assets (favicons, manifest)
│   └── src/
│       ├── assets/           # Images, SVGs, and global stylesheets
│       ├── components/       # Reusable UI components (Buttons, Modals, Navbars)
│       ├── contexts/         # React Context API providers (Auth Context)
│       ├── pages/            # View components split by user role:
│       │   ├── admin/        # Salon-specific administrator views
│       │   ├── auth/         # Login and Registration screens
│       │   ├── customer/     # Public facing landing pages and booking flows
│       │   ├── staff/        # Staff specific dashboards
│       │   └── superadmin/   # Global platform management views
│       ├── services/         # Axios API clients for communicating with the backend
│       ├── App.jsx           # Main React component and Route definitions
│       └── main.jsx          # React DOM rendering entry point
│
├── README.md                 # Project-level overview and setup instructions
└── PROJECT_ARCHITECTURE.md   # This documentation file
```
