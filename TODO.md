# TODO - Salon Feedback Rating Display

Task: In customer salon section, show the feedback rating. If customers have given any ratings, sum/average them; otherwise show 0.

## Backend
- [x] Import Feedback model in salonController.js
- [x] Create helper to compute average rating per salon (from serviceRating + staffRating) and count reviews
- [x] Attach `rating` and `ratingCount` in `getSalons`
- [x] Attach `rating` and `ratingCount` in `getSalonById`

## Frontend
- [x] Replace hardcoded `4.9` with dynamic `branch.rating` (0 if none) in SalonCard.jsx
- [x] Replace hardcoded `4.9` and `(1.2k reviews)` with dynamic rating/count in SalonDetailsPage.jsx

## Follow-up
- [ ] Restart/verify backend picks up controller changes
- [ ] Test salons page and details page display correct rating
