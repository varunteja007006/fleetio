# Fleetio — AGENTS.md

## First: read the right docs

- **Expo SDK 56**: Read https://docs.expo.dev/versions/v56.0.0/ before writing code. This SDK uses React 19.2.3 + React Native 0.85.3.
- **Convex**: Read `.github/convex.instructions.md` (372 lines) before editing `convex/` — covers validators, function calling, schema rules, pagination, testing, etc.

## Project overview

Expo (mobile + web) fleet management app. Not a multi-package monorepo — single app in `src/`. The `example/` dir is a stock Expo starter from `reset-project`, ignore it.

| Layer | Tech | Key files |
|-------|------|-----------|
| Frontend | Expo Router (file-based), NativeWind 5 (Tailwind v4), React 19 | `src/app/` |
| Backend | Convex (real-time BaaS) | `convex/` |
| Auth | Better Auth + phone OTP | `convex/auth.ts`, `src/lib/auth-client.ts` |
| Forms | TanStack React Form + Zod v4 | `src/components/forms/` |
| Icons | `@react-native-vector-icons/ionicons`, lucide | |

**Entrypoint**: `"main": "expo-router/entry"` in package.json. Root layout: `src/app/_layout.tsx`.

## Commands

```sh
pnpm start          # Expo dev server
pnpm android        # dev on Android
pnpm ios            # dev on iOS
pnpm web            # dev on web
pnpm lint           # `expo lint` — ESLint NOT yet configured, will prompt setup
pnpm clean          # removes node_modules, .expo, dist, etc.
pnpm clean:dry      # dry-run of clean

npx convex dev      # start local Convex dev + auto-generate convex/_generated/
npx convex deploy   # deploy Convex to production
```

**No build, test, typecheck, or format scripts exist.** Add them before relying on them.

### Convex codegen

`npx convex dev` auto-generates `convex/_generated/` (api, dataModel, server types). Regenerate after schema or function changes. These files are gitignored — do not edit.

Also auto-generated (not gitignored, do not edit): `expo-env.d.ts`, `nativewind-env.d.ts`.

## Architecture

### Expo Router routes

File-based routing under `src/app/`:

| Route | Screen |
|-------|--------|
| `/` | Login or dashboard link |
| `/dashboard` | Tab navigator (Dashboard, Routes, Profile) |
| `/admin` | Admin dashboard + route CRUD + user management |

`experiments.typedRoutes: true` and `experiments.reactCompiler: true` are on in `app.json`.

### Convex backend

- **Schema** (`convex/schema.ts`): 8 tables — `profiles`, `routes`, `checkpoints`, `routeAssignments`, `routeRuns`, `incidents`, `alerts`, `whatsappGroups`, `routeWhatsappMappings`.
- **Auth flow**: `convex/convex.config.ts` mounts Better Auth component. `convex/auth.ts` creates the server with phone OTP plugin. `convex/http.ts` registers auth routes. Client-side auth in `src/lib/auth-client.ts` uses `@better-auth/expo` + `expo-secure-store`.
- **OTP in dev**: Stubbed — logs code to console. Production SMS sending is commented out in `convex/auth.ts`.
- **Soft-delete pattern**: `isDeleted: boolean` on profiles and routes. Never hard-delete these tables.
- **Role system**: `admin` / `manager` / `driver` / `new_user` with `pending` / `approved` / `rejected` status. New users get `new_user` + `pending` by default.

### Convex do/don't (see also `.github/convex.instructions.md`)

- Always include argument validators on all functions.
- **Don't** use `.filter()` — define indexes and use `.withIndex()`.
- **Don't** use `.collect()` unbounded — use `.take()` or paginate.
- **Don't** use `.collect().length` — maintain a denormalized counter.
- Index naming: `"by_field1_and_field2"` (include all fields in the name).
- Use `ctx.db.patch()` for partial updates, `ctx.db.replace()` for full replaces.
- Actions cannot access `ctx.db` — use `ctx.runQuery`/`ctx.runMutation`.
- Files using Node.js APIs need `"use node";` at top.
- `tokenIdentifier` is the canonical user identifier (not `subject`).
- Environment variables in Convex: use `env` from `_generated/server`, not `process.env`.

## Path aliases (tsconfig.json)

| Alias | Maps to |
|-------|---------|
| `@/` | root (`./`) |
| `~/` | `./src/` |
| `@/assets/` | `./assets/` |

## Style & tooling

- **Styling**: NativeWind 5 (Tailwind v4 via PostCSS). CSS entry: `global.css`. Metro config uses `withNativewind` with `input: "./global.css"`.
- **VS Code**: Auto-fix + organize imports + sort members on save (`.vscode/settings.json`).
- **Package manager**: pnpm. `pnpm-workspace.yaml` allows esbuild builds and overrides lightningcss to 1.30.1.
- **Env vars**: Loaded from `.env.local`. Key vars: `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CONVEX_SITE_URL`, `BETTER_AUTH_SECRET`, `EMAIL_DOMAIN`.

## Testing

**No test infrastructure exists.** When adding tests:
- Use `convex-test` + `vitest` + `@edge-runtime/vm` for Convex functions (per `.github/convex.instructions.md`).
- Test files go inside `convex/` directory.
- Use `convexTest(schema, modules)` with `import.meta.glob`.

## CI

No GitHub Actions workflows exist yet.

## Claude/Cursor plugin

- `.claude/settings.json` enables the `expo@claude-plugins-official` plugin.
- `CLAUDE.md` just references this file via `@AGENTS.md`.
