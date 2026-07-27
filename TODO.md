# TODO — Salon-scoped Staff for Admin

- [ ] Backend: enforce salon ownership in staffController (staff-admin only affects req.user.salon_id)
- [ ] Backend: make staff-admin getStaff always scoped to their salon
- [ ] Frontend: update staffService.getStaff to accept salonId param
- [ ] Frontend: update admin/Staff.jsx to show only staff for logged-in admin salon; hide “other salons” selector
- [ ] Frontend: add “Add Staff” header button and ensure it routes with salonId
- [ ] Frontend: fix Admin quick action routing to pass salonId and render correct AddStaff component
- [ ] Run backend + frontend to verify

