# Driver Already Started Route — Suggestions

**Date:** 2026-07-25
**Context:** Discussion about edge cases when a driver has already started an assigned route, based on the current codebase state.

---

## Current State

The system already prevents a driver from starting two runs simultaneously — `startRouteRun` checks for an existing `"running"` run and rejects with `"You already have an active route run"`.

However, several edge cases are unhandled because **route assignments and route runs are not directly linked** in the schema. There is no foreign key from `routeRuns` to `routeAssignments`.

### Schema gaps identified

- `routeAssignments.create` has no check for duplicate or conflicting assignments
- `startRouteRun` does not verify the driver has an active assignment for the route (security gap — any driver can run any route via the API)
- `routeRuns` has no `assignmentId` field
- No `by_routeId` index on `routeRuns`; queries filter in-memory
- `"delayed"` status exists in the schema but is never set by any mutation (dead code)

---

## Scenarios & Suggestions

### 1. Driver tries to start a second route while one is running

| Aspect | Detail |
|--------|--------|
| **Current** | Blocked — `"You already have an active route run"`. ✓ Correct. |
| **Suggestion** | Keep the block. On the UI side, show the driver their active run screen instead of a generic error. Make the "Start" button disabled with text like "Complete current run first" linking to the active run. |

### 2. Admin assigns a new route while driver has an active run

| Aspect | Detail |
|--------|--------|
| **Current** | `routeAssignments.create` has no check. Assignment succeeds silently. |
| **Suggestion — Option A (strict)** | Reject the assignment if the driver has an active running run. Driver should finish before taking on more work. |
| **Suggestion — Option B (queue)** | Allow the assignment but tag it as `"pending"` or add a `queued: true` field. Show it in the driver's route list as "Queued — available after current route" so they can see what's next. Once the current run completes, promote it to actionable. |
| **Suggestion — Option C (relaxed, current)** | Allow it. The new route appears in the driver's list but they can't start it until they finish/cancel the current one (the existing `"already active"` check handles it). Simple but may confuse drivers who tap "Start" and get an error without clear context. |
| **Recommendation** | Option B — queue it with a visual indicator. Proactive UX without being overly restrictive. |

### 3. Admin deletes an assignment while the driver is running it

| Aspect | Detail |
|--------|--------|
| **Current** | Assignment is hard-deleted. The run continues unaffected (no link between them). |
| **Suggestion — Option A (prevent)** | Block deletion of an assignment if there's an active run for that `routeId` + `driverId`. Return `"Cannot unassign — driver has an active run on this route"`. The admin should force-cancel the run first. |
| **Suggestion — Option B (warn but allow)** | Allow deletion but mark the active run as `"unassigned"` (set a flag). The run continues, but the dashboard shows a subtle warning: "Your assignment for this route has been removed. Finish and notify dispatch." |
| **Suggestion — Option C (cascade cancel)** | Auto-cancel the run when the assignment is deleted. Too aggressive. |
| **Recommendation** | Option A (prevent) for safety. If an admin wants to stop the run, they should cancel it explicitly. |

### 4. Driver is reassigned to a different route mid-run

| Aspect | Detail |
|--------|--------|
| **Current** | No guard. Admin could delete assignment A and create assignment B while the driver is running A. |
| **Suggestion** | Same as #3 — block deleting the active assignment. If the admin wants to reassign, the driver must complete/cancel the current run first. |

### 5. Two drivers assigned to the same route — one starts it

| Aspect | Detail |
|--------|--------|
| **Current** | Both can see the route. Both can technically start it (the `"already active"` check is per-driver, not per-route). |
| **Suggestion — Option A (exclusive run)** | Add a check in `startRouteRun` — if any other driver has a running run on this `routeId`, reject: `"This route is already being run by {driver name}"`. Add an index `by_routeId_and_status` on `routeRuns` to query efficiently. |
| **Suggestion — Option B (inform, allow anyway)** | Allow it but mark both as running. Some fleets do use multiple drivers on the same route (e.g., training, relay). Make this a per-route configuration toggle `allowConcurrentRuns`. |
| **Recommendation** | Option A by default, with a potential per-route toggle if needed later. Add the index regardless. |

### 6. Driver's account is deactivated/rejected while running

| Aspect | Detail |
|--------|--------|
| **Current** | No check. Driver keeps running even if their profile status changes to `rejected`. |
| **Suggestion** | When a profile's status or role changes, check for active runs. If found, either auto-cancel them or flag them for admin review. A rejected driver shouldn't be completing routes. Implement this as a trigger in the `profiles.updateStatus` mutation. |

### 7. Pause/resume (delayed status)

| Aspect | Detail |
|--------|--------|
| **Current** | `"delayed"` status exists in the schema but is never set by any mutation. Dead code. |
| **Suggestion** | Either remove `"delayed"` from the schema union, or implement a `pauseRouteRun` / `delayRouteRun` mutation. This would let a driver pause a route (e.g., break, vehicle issue) without completing or cancelling. The `"delayed"` status would prevent starting another route (since the driver still has an active/in-progress run). When the driver resumes, the status goes back to `"running"`. Add optional `pausedAt` / `resumedAt` fields. |

### 8. Link runs to assignments explicitly

| Aspect | Detail |
|--------|--------|
| **Current** | `routeRuns` has no `assignmentId` field. |
| **Suggestion** | Add an optional `assignmentId: v.optional(v.id("routeAssignments"))` to `routeRuns`. Set it at `startRouteRun` time (look up the driver's active assignment for this route). This: |
| | - Enables the checks in scenarios #3 and #4 above |
| | - Enables analytics: "how many runs per assignment" |
| | - Prevents starting a route without an active assignment (closes a security gap) |
| | - Allows the UI to show "You are not assigned to this route" instead of a generic error |

---

## Recommended Priority Order

| Priority | Change | Why |
|----------|--------|-----|
| **P0** | Block starting a run without an active assignment (add assignment check to `startRouteRun`) | Security gap — a driver can currently run any route |
| **P1** | Link `routeRuns` → `routeAssignments` via `assignmentId` | Enables all downstream checks |
| **P2** | Prevent deleting an assignment with an active run | Data integrity |
| **P3** | Prevent concurrent runs on same route by different drivers | Fleet coordination |
| **P4** | Queued assignment indicator for drivers with active runs | UX improvement |
| **P5** | Implement `pauseRouteRun` / `delayRouteRun` or remove dead `"delayed"` status | Clean up dead code or add feature |
| **P6** | Auto-handle active runs when driver profile is deactivated | Safety/compliance |
