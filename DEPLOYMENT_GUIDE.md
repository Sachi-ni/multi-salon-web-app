# Complete Production Deployment Guide

This guide walks you through deploying the **Multi-Salon Web Application** from scratch to production using industry-standard free/low-cost cloud services:
* **Frontend**: [Vercel](https://vercel.com) (React 19 SPA)
* **Backend**: [Render](https://render.com) (Node.js & Express API)
* **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Managed Cloud Database)
* **Media & Image Storage**: [Cloudinary](https://cloudinary.com) (Persistent cloud storage for salon and staff uploads)
* **AI Engine**: [Google AI Studio](https://aistudio.google.com/) (Gemini API for style recommendations & analytics)

---

## 📑 Table of Contents
1. [Architecture & Deployment Overview](#1-architecture--deployment-overview)
2. [Prerequisites Checklist](#2-prerequisites-checklist)
3. [Step 1: Set Up MongoDB Atlas](#step-1-set-up-mongodb-atlas)
4. [Step 2: Set Up Cloudinary (Persistent Uploads)](#step-2-set-up-cloudinary-persistent-uploads)
5. [Step 3: Deploy Backend on Render](#step-3-deploy-backend-on-render)
6. [Step 4: Seed Initial Superadmin & Run Migrations](#step-4-seed-initial-superadmin--run-migrations)
7. [Step 5: Deploy Frontend on Vercel](#step-5-deploy-frontend-on-vercel)
8. [Step 6: Link Frontend & Backend (CORS & Environment)](#step-6-link-frontend--backend-cors--environment)
9. [Step 7: Production Verification & Smoke Testing](#step-7-production-verification--smoke-testing)
10. [Troubleshooting & Pro Tips](#troubleshooting--pro-tips)

---

## 1. Architecture & Deployment Overview

```
[ User Browser ]
       │
       ▼
[ Vercel (Frontend React SPA) ]
  URL: https://your-salon-app.vercel.app
       │
       │ API Requests (JWT Auth / REST)
       ▼
[ Render (Backend Express API) ]
  URL: https://your-salon-backend.onrender.com
       ├──▶ [ MongoDB Atlas ] (Collections: Salons, Staff, Appointments, Users, etc.)
       ├──▶ [ Cloudinary ] (Uploaded logos, staff avatars, salon banners)
       ├──▶ [ Google Gemini API ] (Chatbot consultations & revenue analysis)
       └──▶ [ SMTP / Nodemailer ] (Appointment emails & password resets)
```

---

## 2. Prerequisites Checklist

Ensure you have created accounts and prepared the following:
* [GitHub](https://github.com) account with this repository pushed to a remote repository.
* [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier M0 is sufficient).
* [Render](https://render.com) account (free tier supports web services).
* [Vercel](https://vercel.com) account (free hobby tier).
* [Cloudinary](https://cloudinary.com) account (free tier).
* [Google AI Studio](https://aistudio.google.com) account (free Gemini API key).
* A Gmail or SMTP email account with an **App Password** for sending automated emails.

---

## Step 1: Set Up MongoDB Atlas

1. **Log in to MongoDB Atlas** and create a new project or organization.
2. Click **Build a Database** and select the **M0 Free Cluster**.
3. Choose a cloud provider (AWS recommended) and region closest to your users.
4. **Create a Database User**:
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Set Authentication Method to **Password**.
   - Enter a username (e.g., `salon_admin`) and generate a secure password.
   - Set Database User Privileges to **Read and write to any database**.
   - Click **Add User** and save the password securely.
5. **Configure Network Access**:
   - Go to **Security > Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - *Note: Cloud platforms like Render assign dynamic outbound IPs, so `0.0.0.0/0` is required.*
6. **Obtain Connection String**:
   - Go to **Database > Clusters**.
   - Click **Connect** > **Drivers** (Node.js).
   - Copy the connection string format:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/multiSalonDB?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials. Replace the database name with `multiSalonDB`.

---

## Step 2: Set Up Cloudinary (Persistent Uploads)

Because serverless/ephemeral cloud hosts (like Render) erase locally uploaded files (`backend/uploads/`) whenever the instance restarts or redeploys, this application automatically streams images to Cloudinary via `backend/utils/mediaStorage.js`.

1. Sign up / log in to [Cloudinary Dashboard](https://console.cloudinary.com/).
2. On your **Dashboard Summary**, copy three values:
   - **Cloud Name** (e.g., `dxy123abc`)
   - **API Key** (e.g., `761629119933571`)
   - **API Secret** (e.g., `9iajojn0xzArKE37qFeHCWmPy0w`)
3. Keep these handy for Step 3.

---

## Step 3: Deploy Backend on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository: `multi-salon-web-app`.
4. Configure the service parameters:

| Field | Value |
|---|---|
| **Name** | `multi-salon-backend` (or your preferred name) |
| **Region** | Select closest region (e.g., Singapore, Frankfurt, Oregon) |
| **Branch** | `main` (or your active deployment branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Under **Environment Variables**, add the following key-value pairs:

| Key | Example / Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production environment mode |
| `PORT` | `10000` | Render sets port automatically, or defaults to 10000 |
| `MONGO_URI` | `mongodb+srv://...` | Connection string from Step 1 |
| `JWT_SECRET` | `generate-a-64-character-random-hex` | Secret for signing JWT authentication tokens |
| `FRONTEND_URL` | `http://localhost:3000` *(temporarily)* | Will be updated with your Vercel URL in Step 6 |
| `CLOUDINARY_CLOUD_NAME` | `your_cloudinary_cloud_name` | Cloudinary Cloud Name from Step 2 |
| `CLOUDINARY_API_KEY` | `your_cloudinary_api_key` | Cloudinary API Key from Step 2 |
| `CLOUDINARY_API_SECRET` | `your_cloudinary_api_secret` | Cloudinary API Secret from Step 2 |
| `GEMINI_API_KEY` | `your_gemini_api_key` | From Google AI Studio |
| `EMAIL_USER` | `your-email@gmail.com` | Notification sender email address |
| `EMAIL_PASS` | `your-16-char-app-password` | Gmail 16-character App Password (not your personal password) |
| `SUPERADMIN_EMAIL` | `admin@salonhub.com` | Superadmin initial account email |
| `SUPERADMIN_INITIAL_PASSWORD` | `AdminSecurePass123!` | Superadmin initial account password |

6. Click **Create Web Service**.
7. Wait 2–3 minutes for the build and deployment to complete.
8. Once live, test the root endpoint in your browser:
   `https://multi-salon-backend.onrender.com/`
   Expected response:
   ```
   Salon Management API Running
   ```

---

## Step 4: Seed Initial Superadmin & Run Migrations

To initialize the database with a root Superadmin user:

### Option A: Via Render Shell (Recommended)
1. On your Render Web Service dashboard, click **Shell** in the left menu.
2. Run the seed script:
   ```bash
   npm run seed:superadmin
   ```
3. Run any database migrations:
   ```bash
   npm run migrate:salon-status
   ```
4. Verify the output confirms: `Superadmin created/verified successfully`.

### Option B: From Your Local Terminal
Point your local `backend/.env` to the production `MONGO_URI` and run:
```bash
cd backend
npm run seed:superadmin
npm run migrate:salon-status
```

---

## Step 5: Deploy Frontend on Vercel

The frontend contains `vercel.json` with SPA rewrites configured for smooth React Router navigation.

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Select your repository `multi-salon-web-app` and click **Import**.
4. Configure the project settings:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click **Edit** and choose `frontend`.
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `build` (default)
   - **Install Command**: `npm install` (default)
5. Under **Environment Variables**, add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://multi-salon-backend.onrender.com/api`
   *(Make sure to append `/api` to your Render backend URL, with no trailing slash!)*
6. Click **Deploy**.
7. Wait 1–2 minutes. Vercel will assign a production URL, e.g.:
   `https://multi-salon-web-app.vercel.app`

---

## Step 6: Link Frontend & Backend (CORS & Environment)

1. Return to the [Render Dashboard](https://dashboard.render.com/).
2. Select your `multi-salon-backend` service.
3. Go to **Environment**.
4. Update `FRONTEND_URL` to your production Vercel URL:
   ```env
   FRONTEND_URL=https://multi-salon-web-app.vercel.app
   ```
   *(If you have custom domains or preview URLs, you can provide comma-separated values, e.g., `https://multi-salon-web-app.vercel.app,https://salonhub.com`)*
5. Click **Save Changes**. Render will automatically trigger a zero-downtime redeploy.

---

## Step 7: Production Verification & Smoke Testing

Perform the following smoke tests on your deployed frontend (`https://multi-salon-web-app.vercel.app`):

1. **Authentication Test**:
   - Log in using your Superadmin credentials (`SUPERADMIN_EMAIL` and `SUPERADMIN_INITIAL_PASSWORD`).
   - Confirm access to the Superadmin Dashboard (`/superadmin/dashboard`).
2. **Salon Creation & Image Upload**:
   - Create a test salon with logo and cover photo.
   - Verify image URLs start with `https://res.cloudinary.com/...`.
3. **Staff & Service Management**:
   - Add a staff member and assign services.
   - Verify working hours and availability.
4. **Customer Booking Flow**:
   - Open an incognito window, browse the salon, and book an appointment.
   - Confirm the booking appears in the manager and staff schedules.
5. **AI Chatbot Verification**:
   - Open the floating Chatbot.
   - Ask for style advice or service recommendations.
   - Confirm responses generate smoothly using the Gemini API.
6. **Email Notifications**:
   - Verify confirmation emails are received upon booking and appointment status changes.

---

## Troubleshooting & Pro Tips

### 1. Handling Render Free Tier Spin-Down (Cold Starts)
Render free services spin down after 15 minutes of inactivity, causing the first request to take 30–50 seconds.
* **Solution**: Use a free uptime monitoring tool such as [UptimeRobot](https://uptimerobot.com/) or [cron-job.org](https://cron-job.org/) to ping `https://multi-salon-backend.onrender.com/` every 10 minutes to keep the instance active.

### 2. CORS Errors in Browser Console
* **Symptom**: `Access to fetch at ... from origin ... has been blocked by CORS policy`.
* **Fix**: Ensure `FRONTEND_URL` on Render matches your exact Vercel domain without trailing slashes. Note that `server.js` already automatically permits any `*.vercel.app` subdomain!

### 3. MongoDB Connection Failures (`ENETUNREACH`)
* **Symptom**: `MongooseServerSelectionError: connect ENETUNREACH`.
* **Fix**: The backend already includes `dns.setDefaultResultOrder("ipv4first");` in `server.js` to prevent IPv6 routing bugs in cloud containers. Ensure MongoDB Atlas **Network Access** includes `0.0.0.0/0`.

### 4. Page Refresh Results in 404 on Vercel
* **Fix**: Ensure `frontend/vercel.json` exists with the rewrite rule:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

---

## Summary Configuration Matrix

| Component | Platform | Key Config / Commands | Primary Env Variables |
|---|---|---|---|
| **Frontend** | Vercel | Root: `frontend`<br>Build: `npm run build`<br>Output: `build` | `REACT_APP_API_URL=https://<backend-domain>/api` |
| **Backend** | Render | Root: `backend`<br>Build: `npm install`<br>Start: `npm start` | `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CLOUDINARY_*`, `GEMINI_API_KEY`, `EMAIL_*` |
| **Database** | MongoDB Atlas | Cluster: M0 (Free)<br>Network: `0.0.0.0/0` | User with read/write access |
| **Media** | Cloudinary | Auto-configured via backend `mediaStorage.js` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
