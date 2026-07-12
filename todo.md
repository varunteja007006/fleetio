# Fleetio Mobile App - Implementation Todo

## Legend
- ✅ Done
- ⚠️ Partial
- ❌ Not started

---

## Phase 1 - Authentication & User Management
**Status: ⚠️ Partial**

- ✅ Better Auth setup (auth.ts, http.ts, convex.config.ts, auth.config.ts)
- ✅ OTP Sign Up / Login (otp-sign-up.tsx)
- ✅ Logout (profile.tsx)
- ✅ Session management (Convex + Better Auth)
- ✅ Profiles table (schema: authUserId, role, status, phone, email, etc.)
- ✅ Roles: admin, manager, driver, new_user
- ✅ Statuses: pending, approved, rejected
- ✅ Auto-create profile on user signup (auth.ts trigger)
- ⚠️ Admin users list (basic index.tsx with pagination, empty detail/new screens)
- ❌ Admin approve/reject flow for drivers
- ❌ Admin user detail screen (users/[user_id]/index.tsx is empty)
- ❌ Admin new user creation screen (users/new/index.tsx is stub)
- ❌ SMS OTP integration (Fast2SMS/MSG91 - currently console.log only)

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

## Development Order (per spec)
1. ✅ Better Auth
2. ⚠️ Users + Roles (admin approval still needed)
3. ⚠️ Routes (checkpoint UI still needed)
4. ❌ Checkpoints (UI + backend)
5. ❌ Route Assignment
6. ❌ Start Route
7. ❌ GPS Tracking
8. ❌ Checkpoint Detection
9. ❌ Delay Detection
10. ❌ Notifications
11. ❌ Incidents + Photos
12. ❌ WhatsApp
13. ❌ Dashboard
14. ❌ Analytics
