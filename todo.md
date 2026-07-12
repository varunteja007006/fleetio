# Fleetio Mobile App - Implementation Todo

## Legend
- ✅ Done
- ⚠️ Partial
- ❌ Not started

---

> **Current priority: Phase 1 — Authentication & User Management**
> Detailed breakdown with todos at the bottom.

---

## Phase 1 - Authentication & User Management
**Status: ✅ Mostly done (3 tasks remaining)**

- ✅ Better Auth setup (auth.ts, http.ts, convex.config.ts, auth.config.ts)
- ✅ OTP Sign Up / Login (otp-sign-up.tsx)
- ✅ Logout (profile.tsx)
- ✅ Session management (Convex + Better Auth)
- ✅ Profiles table (schema: authUserId, role, status, phone, email, firstName, lastName, etc.)
- ✅ Roles: admin, manager, driver, new_user
- ✅ Statuses: pending, approved, rejected
- ✅ Auto-create profile on user signup (auth.ts trigger)
- ✅ Admin users list with search, filter tabs, role/status badges
- ✅ Admin approve/reject/role change mutations + UI in user detail screen
- ✅ Admin user detail screen (users/[user_id]/index.tsx with full info + actions)
- ✅ Profile update mutation (convex)
- ✅ Profile edit screen (dashboard/edit-profile.tsx)
- ✅ updateProfile mutation
- ✅ updateUserStatus + updateUserRole mutations (admin)
- ✅ getPendingProfiles query (admin)
- ❌ SMS OTP - production provider integration (Fast2SMS/MSG91 - currently console.log)
- ❌ Route guards / auth middleware
- ❌ Dashboard "Complete Profile" prompt

---

## Phase 2 - Route Management
**Status: ⚠️ Partial (Backend ✅, Checkpoint UI ❌)**

- ✅ Routes CRUD (create, list, getById, update, soft delete - routes.ts)
- ✅ Admin route list + create screen (admin/route/index.tsx)
- ✅ Admin route edit screen (admin/route/[route_id]/index.tsx)
- ✅ Checkpoints table schema (routeId, sequence, name, lat, lng, expectedTravelMinutes)
- ❌ Checkpoint management UI (no screens to add/edit/reorder checkpoints within a route)
- ❌ Checkpoint backend functions (no convex mutations/queries for checkpoints yet)

---

## Phase 3 - Route Assignment
**Status: ❌ Not started**

- ✅ routeAssignments table schema (routeId, driverId, assignedBy, active)
- ❌ Admin assign screen (select driver + select route + assign)
- ❌ Driver "My Assigned Routes" screen
- ❌ Backend functions for assignment CRUD

---

## Phase 4 - Route Execution
**Status: ❌ Not started**

- ✅ routeRuns table schema (routeId, driverId, startedAt, completedAt, status)
- ❌ checkpointVisits table (NOT in schema - needs to be created)
- ❌ Start Route flow (driver starts a run, creates routeRun + checkpointVisits)
- ❌ Complete route / cancel route
- ❌ Backend functions for route runs

---

## Phase 5 - GPS Tracking
**Status: ❌ Not started**

- ❌ driverLocations table (NOT in schema - needs: routeRunId, lat, lng, timestamp)
- ❌ Background location sending (30-60 sec intervals)
- ❌ Live tracking on map
- ❌ Current driver location view
- ❌ Route playback

---

## Phase 6 - Checkpoint Detection
**Status: ❌ Not started**

- ❌ Auto-detect when driver is within 100m of checkpoint
- ❌ Auto-mark checkpointVisit.status = "completed" with reachedAt timestamp
- ❌ Server-side location processing

---

## Phase 7 - Delay Detection
**Status: ❌ Not started**

- ✅ alerts table schema (routeRunId, checkpointId, type, message, sentToDriver, sentToManager)
- ❌ Cron job (every 5 min) to compare expected vs actual arrival
- ❌ Grace period logic
- ❌ Create Delay Alert when overdue

---

## Phase 8 - Push Notifications
**Status: ❌ Not started**

- ❌ Expo Push / FCM / OneSignal setup
- ❌ Notify driver: "You are delayed by X mins"
- ❌ Notify manager: "Driver ABC delayed at Checkpoint 3"

---

## Phase 9 - Incident Management
**Status: ❌ Not started**

- ✅ incidents table schema (routeRunId, checkpointId, reason, description, photoUrls, reportedAt)
- ❌ Incident reporting UI (driver opens alert → upload photos → select reason → submit)
- ❌ Photo upload (camera/gallery integration)
- ❌ Reasons: Traffic, Breakdown, Accident, Weather, Other

---

## Phase 10 - WhatsApp Integration
**Status: ❌ Not started**

- ✅ whatsappGroups table schema
- ✅ routeWhatsappMappings table schema
- ❌ Generate incident message with template
- ❌ Send WhatsApp on incident creation

---

## Phase 11 - Manager Dashboard
**Status: ❌ Not started**

- ❌ Metrics cards: Running Routes, Completed Routes, Delayed Routes, Incidents Today
- ❌ Live Map view
- ❌ Driver List
- ❌ Route List
- ❌ Alerts feed

---

## Phase 12 - Nice-to-Have Features
**Status: ❌ Not started**

- ❌ Route deviation detection + alert manager
- ❌ ETA prediction (current speed + traffic + checkpoint history)
- ❌ Vehicle Assignment (vehicles + vehicleAssignments tables)
- ❌ Driver History (routes completed, avg delay, incidents)

---

# Phase 1 — Detailed Implementation Todos

## ✅ 1.1 Convex: Profile update mutation
**File:** `convex/profile.ts`
- ✅ `updateProfile` mutation added
- Fields: firstName, lastName, aadharNumber, panNumber, emergencyPhone, insurance, hasInsurance
- Gets current user via `authComponent.getAuthUser(ctx)`
- Only patches provided fields
- Returns profile `_id`

## ✅ 1.2 Convex: Admin approve/reject/role mutations
**File:** `convex/profile.ts`
- ✅ `updateUserStatus` mutation — admin only, patches status to approved/rejected
- ✅ `updateUserRole` mutation — admin only, patches role to admin/manager/driver/new_user
- Both check caller is admin via profile lookup

## ✅ 1.3 Convex: Query pending users
**File:** `convex/profile.ts`
- ✅ `getPendingProfiles` query — admin only, returns profiles where status === "pending"

## ✅ 1.4 Frontend: Admin user detail screen
**File:** `src/app/admin/users/[user_id]/index.tsx`
- ✅ Shows full profile info in sections (Personal, Identity, Emergency)
- ✅ Approve/Reject buttons when status is pending
- ✅ Role changer (admin/manager/driver pressable buttons)
- ✅ Status and role badges with colors
- ✅ Loading and not-found states

## ✅ 1.6 Frontend: Profile edit screen
**File:** `src/app/dashboard/edit-profile.tsx`
- ✅ Edit firstName, lastName, aadharNumber, panNumber, emergencyPhone, insurance, hasInsurance
- ✅ Pre-populated with existing profile data
- ✅ Yes/No toggle for hasInsurance
- ✅ Navigates back on save

## ✅ 1.7 Frontend: Admin users list polish
**File:** `src/app/admin/users/index.tsx`
- ✅ Search bar (name, phone, email)
- ✅ Filter tabs: All | Pending | Approved | Rejected
- ✅ Role and status badges per user row
- ✅ Tappable rows → navigate to user detail
- ✅ Pagination with Load More

## ❌ 1.8 Backend: SMS OTP production integration
**File:** `convex/auth.ts`
- Uncomment and configure Fast2SMS/MSG91 integration
- Use `env` from `_generated/server` (not process.env) for API keys
- Add proper error handling

## ❌ 1.9 Frontend: Auth route guard
**File:** `src/app/_layout.tsx` or per-route
- Redirect unauthenticated users to login
- Check profile status (pending users should see limited access)
- Check role for admin-only routes
- Consider creating a `useAuthGuard` hook

## ❌ 1.10 Frontend: Dashboard "Complete Profile" prompt
**File:** `src/app/dashboard/(tabs)/index.tsx`
- Detect `new_user` or missing firstName/lastName
- Show persistent banner/modal to complete profile
- Link to profile edit screen

---

## Implementation order (Phase 1)

```
1.  ✅ 1.1  →  Convex: updateProfile mutation
2.  ✅ 1.2  →  Convex: Admin approve/reject/role mutations
3.  ✅ 1.3  →  Convex: getPendingProfiles query
4.  ✅ 1.4  →  Admin user detail screen
5.  ✅ 1.6  →  Profile edit screen
6.  ✅ 1.7  →  Admin users list polish
7.  ❌ 1.9  →  Auth route guard
8.  ❌ 1.10 →  Dashboard profile prompt
9.  ❌ 1.8  →  SMS OTP production (last — no impact on dev flow)
```
