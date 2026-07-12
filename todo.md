# Fleetio Mobile App - Implementation Todo

## Legend
- ✅ Done
- ⚠️ Partial
- ❌ Not started

---

> **Current priority: Phase 4 — Route Execution**
> Detailed breakdown with todos at the bottom.

---

## Phase 1 - Authentication & User Management
**Status: ✅ Mostly done (1 task remaining)**

- ✅ Better Auth setup (auth.ts, http.ts, convex.config.ts, auth.config.ts)
- ✅ OTP Sign Up / Login (`~/components/auth/otp-sign-up`, imported in `src/app/index.tsx`)
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
- ✅ Dashboard "Complete Profile" prompt (`dashboard/(tabs)/index.tsx` lines 187-205, shown when firstName is missing)
- ✅ Route guards / auth middleware (`useAuthGuard` hook with admin layout guard, dashboard auth guard)
- ❌ SMS OTP - production provider integration (Fast2SMS/MSG91 - currently console.log)

---

## Phase 2 - Route Management
**Status: ✅ Complete**

- ✅ Routes CRUD (create, list, getById, update, soft delete - routes.ts)
- ✅ Admin route list + create screen (admin/route/index.tsx)
- ✅ Admin route edit screen (admin/route/[route_id]/index.tsx)
- ✅ Checkpoints table schema (routeId, sequence, name, lat, lng, expectedTravelMinutes)
- ✅ Checkpoint backend functions (convex/checkpoints.ts — listByRoute, getById, create, update, remove, reorder)
- ✅ Checkpoint management UI (inline add/edit/reorder/delete in admin route edit screen)

---

## Phase 3 - Route Assignment
**Status: ✅ Complete**

- ✅ routeAssignments table schema (routeId, driverId, assignedBy, active)
- ✅ Admin assign screen (select driver + select route + assign) — `src/app/admin/assignments/index.tsx`
- ✅ Driver "My Assigned Routes" screen — `src/app/dashboard/(tabs)/routes.tsx` (role-aware: drivers see assigned routes, admins/managers see all routes)
- ✅ Backend functions for assignment CRUD — `convex/routeAssignments.ts` (listByDriver, listAll, create, remove, getActiveAssignmentForRoute)

---

## Phase 4 - Route Execution
**Status: ⚠️ Partial**

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
**Status: ⚠️ Partial**

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
**Status: ⚠️ Partial**

- ✅ incidents table schema (routeRunId, checkpointId, reason, description, photoUrls, reportedAt)
- ❌ Incident reporting UI (driver opens alert → upload photos → select reason → submit)
- ❌ Photo upload (camera/gallery integration)
- ❌ Reasons: Traffic, Breakdown, Accident, Weather, Other

---

## Phase 10 - WhatsApp Integration
**Status: ⚠️ Partial**

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

# Phase 4 — Detailed Implementation Todos

## ❌ 4.1 Schema: checkpointVisits table
**File:** `convex/schema.ts`
- Fields: routeRunId, checkpointId, status (pending/completed/skipped), reachedAt, createdAt
- Index by routeRunId and checkpointId

## ❌ 4.2 Convex: Route run CRUD
**File:** `convex/routeRuns.ts`
- `startRouteRun` mutation — creates routeRun + checkpointVisits for all checkpoints in the route
- `completeRouteRun` mutation — marks routeRun as completed with completedAt timestamp
- `cancelRouteRun` mutation — marks routeRun as cancelled
- `getActiveRun` query — returns the current active routeRun for a driver
- `getRouteRunById` query — returns routeRun with enriched checkpointVisit data

## ❌ 4.3 Frontend: Start route screen
**File:** `src/app/dashboard/start-route.tsx`
- Select from assigned routes
- "Start Route" button → creates routeRun + navigates to active run screen
- Confirm dialog before starting
- Loading state while creating

## ❌ 4.4 Frontend: Active route run screen
**File:** `src/app/dashboard/active-run.tsx`
- Shows route progress (checkpoint list with status)
- Current checkpoint highlight
- Complete Route / Cancel Route buttons
- Real-time status updates

## ❌ 4.5 Frontend: Route history screen
**File:** `src/app/dashboard/route-history.tsx`
- List of past route runs with status, date, duration
- Tap to view details (checkpoint completion times)

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

## ✅ 1.9 Frontend: Auth route guard
**File:** `src/hooks/use-auth-guard.ts`, `src/app/admin/_layout.tsx`, `src/app/dashboard/(tabs)/_layout.tsx`, `src/app/dashboard/edit-profile.tsx`
- ✅ `useAuthGuard` hook created — redirects unauthenticated users to `/`, checks role for admin-only routes, supports `requireAdmin` and `requireApproved` options
- ✅ Admin `_layout.tsx` wraps all admin screens with admin role guard
- ✅ Dashboard tabs layout redirects unauthenticated users to login
- ✅ Dashboard edit-profile screen guarded from unauthenticated access

## ✅ 1.10 Frontend: Dashboard "Complete Profile" prompt
**File:** `src/app/dashboard/(tabs)/index.tsx`
- ✅ Detects missing firstName/lastName (`noFirstName` check)
- ✅ Shows persistent red banner linking to profile screen
- ✅ Links to `/dashboard/(tabs)/profile` for editing

---

# Phase 3 — Detailed Implementation Todos

## ✅ 3.1 Convex: Schema indexes
**File:** `convex/schema.ts`
- ✅ Added `by_status_and_role` compound index to profiles table
- ✅ Added `by_driverId` and `by_routeId` indexes to routeAssignments table

## ✅ 3.2 Convex: Route assignment CRUD
**File:** `convex/routeAssignments.ts`
- ✅ `listByDriver` query — returns active assignments for the current authenticated driver, enriched with route data
- ✅ `listAll` query — admin-only, returns all assignments enriched with route, driver profile, and assigner profile
- ✅ `create` mutation — admin-only, accepts profileId + routeId, creates assignment with active=true
- ✅ `remove` mutation — admin-only, hard-deletes an assignment
- ✅ `getActiveAssignmentForRoute` query — returns active assignment for a given route (used for future phases)

## ✅ 3.3 Convex: getDrivers query
**File:** `convex/profile.ts`
- ✅ `getDrivers` query — admin-only, returns all profiles with status="approved" and role="driver" using the new compound index

## ✅ 3.4 Frontend: Admin assignment screen
**File:** `src/app/admin/assignments/index.tsx`
- ✅ List all assignments with driver name, route name, status badge, and assigned-by info
- ✅ Create assignment form with driver picker and route picker (chip-style selectors)
- ✅ Remove assignment with confirmation alert

## ✅ 3.5 Frontend: Driver assigned routes screen
**File:** `src/app/dashboard/(tabs)/routes.tsx`
- ✅ Role-aware: drivers see "My Routes" with their assigned routes
- ✅ Admins/managers see all routes in a simple browse view
- ✅ Empty state for no assignments

## ✅ 3.6 Frontend: Admin dashboard link
**File:** `src/app/admin/index.tsx`
- ✅ "Route Assignments" quick action card linking to the assignments screen

---

## Implementation order (Phase 1)

```
1.  ✅ 1.1  →  Convex: updateProfile mutation
2.  ✅ 1.2  →  Convex: Admin approve/reject/role mutations
3.  ✅ 1.3  →  Convex: getPendingProfiles query
4.  ✅ 1.4  →  Admin user detail screen
5.  ✅ 1.6  →  Profile edit screen
6.  ✅ 1.7  →  Admin users list polish
7.  ✅ 1.10 →  Dashboard profile prompt
8.  ✅ 1.9  →  Auth route guard
9.  ❌ 1.8  →  SMS OTP production (last — no impact on dev flow)
```

## Implementation order (Phase 4)

```
1.  ❌ 4.1  →  Schema: checkpointVisits table
2.  ❌ 4.2  →  Convex: Route run CRUD
3.  ❌ 4.3  →  Frontend: Start route screen
4.  ❌ 4.4  →  Frontend: Active route run screen
5.  ❌ 4.5  →  Frontend: Route history screen
```
