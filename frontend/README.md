# MERN Stack Project - Frontend

This is the frontend client for the Multi-Salon Web App, built using React.js. It provides a responsive, beautifully designed user interface with distinct dashboards and features tailored for Customers, Staff, Managers, and Super Admins.

## 🚀 Tech Stack
- **React.js** (Frontend Library)
- **Vite / Create React App** (Build Tool)
- **React Router Dom** (Navigation & Protected Routes)
- **Axios** (API Integration)
- **Tailwind CSS** (Utility-first Styling & Glassmorphism)
- **Framer Motion** (Dynamic Animations & Transitions)
- **Lucide React** (Beautiful Icons)

## 📁 Project Structure

```text
frontend/
├── public/                 # Static assets (favicon, index.html, etc.)
├── src/                    # Main source code directory
│   ├── assets/             # Images, static icons, and fonts
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Shared page layouts (Header, Sidebar, Dashboard Layouts)
│   │   └── ui/             # Reusable atomic UI elements (Buttons, Inputs, Cards)
│   ├── context/            # Global React Context providers (e.g., AuthContext)
│   ├── pages/              # Application pages organized by user role
│   │   ├── admin/          # Salon-specific admin and manager dashboards
│   │   ├── auth/           # Login, Registration, and Account management
│   │   ├── customer/       # Customer-facing views (Booking, Salons, Profile)
│   │   ├── staff/          # Staff-specific dashboards and schedules
│   │   └── superadmin/     # Super Admin overarching management views
│   ├── routes/             # Routing configuration and protected role-based guards
│   ├── services/           # Axios API integration functions and service calls
│   ├── utils/              # Utility and helper functions (Date formatting, slots)
│   ├── App.jsx             # Root React component containing the main router
│   └── index.css           # Global Tailwind directives and custom animations
├── tailwind.config.js      # Tailwind CSS configuration and theme extensions
└── package.json            # Project dependencies and scripts
```

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v16 or higher recommended).

### 2. Installation
Navigate to the frontend folder and install the necessary dependencies:
```bash
npm install
```

### 3. Environment Setup (Optional)
If your backend is hosted on a different URL/Port, ensure your API base URLs in the `src/services` directory are updated appropriately. By default, it communicates with `http://localhost:5000`.

### 4. Running the Development Server
Start the development server with hot-reloading:
```bash
npm start
```
The application will be accessible at `http://localhost:3000`.

## ✨ Key Features
- **Role-Based Dashboards**: Entirely different UI flows depending on the logged-in user's role.
- **Premium Aesthetics**: High-end styling using Tailwind CSS, including dark modes, glassmorphism, and dynamic animated backgrounds using Framer Motion.
- **Seamless Booking**: Easy-to-use customer booking flow with step-by-step UI.