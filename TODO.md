# Task: Show staff ratings (from Feedback) across Superadmin, Manager, and Customer views

## Problem
- The superadmin reviews page computes average staff ratings from the Feedback collection.
- The `/api/staff` endpoint (used by superadmin & manager) and `/api/team` endpoint (used by customer team page) do NOT attach the rating, so staff cards show default/0 values.

## Plan
- [x] Backend: In `backend/controllers/staffController.js`, compute average `staffRating` per staff from `Feedback` collection.
- [x] Backend: Attach computed `rating` to each staff member in `getStaff` (superadmin & manager).
- [x] Backend: Attach computed `rating` to each staff member in `getTeam` (customer team page).
- [x] Frontend: Customer team StaffCard already reads `member.rating` — displays correctly.
- [x] Frontend: Superadmin StaffCard already reads `staff.rating` — displays correctly.
- [x] Frontend: Superadmin StaffCard rating now defaults to `0.0` (instead of `5.0`) when no feedback rating exists, matching the manager dashboard (`frontend/src/pages/superadmin/Staff.jsx`).
- [x] Frontend: Added Staff Rating display to manager's admin StaffCard (`frontend/src/pages/admin/Staff.jsx`).
- [x] Verify by restarting backend and loading the pages.
