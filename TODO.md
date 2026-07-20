# Fix: Super Admin "Access Denied" after profile update

## Root Cause
Redirect path `/Profile` in `edit.jsx` doesn't match any defined route. Super-admin profile is at `/super-profile`.

## Steps

- [x] Step 1: Analyze codebase and identify root cause
- [x] Step 2: Present plan to user
- [x] Step 3: Fix `edit.jsx` - Change redirect path from `/Profile` to `/super-profile` + explicitly include role, id, salon_id in updatedUser
- [x] Step 4: Fix `managerprofile.jsx` - explicitly include role, id, salon_id in updatedUser
- [x] Step 5: Verified profile page navigation buttons navigate to /editProfile correctly

