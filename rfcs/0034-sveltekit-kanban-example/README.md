---
rfc: "0034-sveltekit-kanban-example"
title: "SvelteKit example app (Kanban modeled on tasks/rfcs)"
status: draft
created: 2026-06-17
updated: 2026-06-17
owner: "@sveltekit-kanban-example-rfc"
packages:
  - "activerecord"
clusters:
  - "examples"
---

# RFC 0034 — SvelteKit example app (Kanban modeled on tasks/rfcs)

## Summary

Add a second runnable example app under `examples/`: a **SvelteKit** Kanban
tracker that uses `@blazetrails/activerecord` from inside SvelteKit's
server context (`load` functions, form actions, and `+server.ts` API routes).
The domain dogfoods the project's own structure — a board is an RFC, a column
is a story `status`, a card is a story — exercising the widest practical slice
of ActiveRecord (nested `includes`, enums, scopes, validations rendered as form
errors, transactions, and a self-referential `hasMany :through` for story
dependencies) while staying small. This RFC fixes the architecture and decisions;
the build itself is filed as follow-on stories.

## Motivation

`packages/activerecord/README.md` (added in #3542) advertises a **planned Vite
example** for front-end / SPA integration (`README.md:177`). Today the only
example is `examples/twitter-clone/` — Express + `better-sqlite3`, fully
server-side, born from RFC 0003 (#2638). New users arriving from a modern
full-stack / front-end background expect to see ActiveRecord working inside a
framework they recognize.

The pivotal constraint is that **ActiveRecord is server-side only.** There is
no browser/wasm SQLite adapter: the adapters in
`packages/activerecord/src/connection-adapters/` target Node
(`sqlite3` / `better-sqlite3` / `node-sqlite`, `pg`, `mysql2`) or React Native
(`expo-sqlite`). A pure-Vite SPA cannot run AR in the browser. **SvelteKit**
resolves the tension: it is a Vite-based full-stack framework with a real
server runtime, so AR runs server-side in `load` / actions / `+server.ts` while
the Svelte front-end renders the board. This satisfies the README's "Vite
example" intent without pretending AR can run client-side.

The pairing is natural:

- **Form actions** map onto AR validations: a failed `createBang` / `isValid()`
  maps to `fail(422, { errors })`, and field errors render inline — the
  SvelteKit idiom for exactly the `RecordInvalid` flow `twitter-clone` shows
  over HTTP.
- **`load` functions** map onto queries + `includes` eager loading: a board page
  loads its RFC with stories and assignees in one `includes` call.

## Design

### Architecture: SvelteKit server-side AR

AR runs only in server modules — `+page.server.ts` (`load` + `actions`),
`+server.ts` (JSON API routes), and `hooks.server.ts` (bootstrap). No AR import
ever reaches a `.svelte` component or a universal `+page.ts`, keeping all
`node:`-backed adapter code out of the client bundle. The adapter is
**`better-sqlite3`**, matching `twitter-clone` for parity and zero-config local
runs.

### Connection bootstrap inside the SvelteKit lifecycle

SvelteKit has no Rails-style autoload, so model definition and connection setup
must be made explicit and idempotent — mirroring `twitter-clone/src/db.ts`
(`connect()` + `loadModelSchemas()`). The bootstrap runs **once** in
`src/hooks.server.ts` (the server entry that executes before any request):

```ts
// src/lib/server/db.ts
import { Base, registerModel } from "@blazetrails/activerecord";
import { Rfc, Story, User, StoryDependency } from "./models/index.js";

const MODELS = [Rfc, Story, User, StoryDependency];
let booted = false;

export async function boot(): Promise<void> {
  if (booted) return;
  await Base.establishConnection(); // reads config/database.ts for TRAILS_ENV
  for (const m of MODELS) registerModel(m);
  await Promise.all(MODELS.map((m) => m.loadSchema()));
  booted = true;
}
```

```ts
// src/hooks.server.ts
import { boot } from "$lib/server/db.js";
export async function handle({ event, resolve }) {
  await boot();
  return resolve(event);
}
```

`establishConnection()` with no args reads `config/database.ts` keyed on
`TRAILS_ENV`, exactly as in `twitter-clone`. Importing `models/index.ts`
(re-exporting every model) guarantees each class is _defined_ before
`registerModel`; `loadSchema()` reflects columns from the live DB so models stay
zero-declare at runtime.

### Typechecking: `trails-tsc` stays a separate step

`trails-tsc --schema db/schema.ts --noEmit` reads the dumped schema and injects
`declare` members for the zero-declare models. This is a **standalone**
`pnpm typecheck` script — it is **not** wired into Vite/SvelteKit's esbuild
dev/bundle path. Vite uses esbuild for transpile-only bundling (no type
emission), and `svelte-check` handles `.svelte` type-checking; AR model types
come from `trails-tsc` against `db/schema.ts`. Keeping them separate avoids
coupling the bundler to the schema dumper and matches the `twitter-clone`
`pnpm typecheck` convention.

### Domain: a Kanban tracker modeled on tasks/rfcs

| Kanban concept | Maps to        | AR shape                                                               |
| -------------- | -------------- | ---------------------------------------------------------------------- |
| Board          | RFC            | `Rfc hasMany :stories`                                                 |
| Column         | Story `status` | `enum status: { draft, ready, in_progress, done, blocked }`            |
| Card           | Story          | `Story belongsTo :rfc, belongsTo :assignee (User)`                     |
| Priority       | integer        | `priority` (lower = higher, mirrors `pnpm tasks priority`)             |
| Dependencies   | self-join      | `Story hasMany :dependencies, through: :story_dependencies` (self-ref) |

- **Scopes:** `ready`, `blocked`, `assignedTo(user)`, `byCluster`.
- **Validations:** `title` presence, `slug` uniqueness (`validatesUniqueness`)
  rendered as SvelteKit form-action field errors via `fail(422, { errors })`.
- **Transactions:** claim a story, move a card across columns, reorder — each
  a `Base.transaction(...)` wrapping the writes.

This exercises nested `includes`, enums, scopes, validations-to-forms,
transactions, and self-referential `hasMany :through` while staying small, and
it visibly mirrors how the project itself is run.

### Directory layout

Mirrors `examples/twitter-clone`'s "exercises what you reach for first" framing,
adapted to SvelteKit conventions:

```text
examples/sveltekit-kanban/
  README.md
  package.json
  svelte.config.js
  vite.config.ts
  tsconfig.json
  config/database.ts
  db/
    schema.ts                 # dumped; trails-tsc reads this
    seeds.ts
    migrate/
      <ts>_create_users.ts
      <ts>_create_rfcs.ts
      <ts>_create_stories.ts
      <ts>_create_story_dependencies.ts
  src/
    hooks.server.ts           # boot() once
    lib/server/
      db.ts                   # connect + registerModel + loadSchema
      models/
        index.ts  rfc.ts  story.ts  user.ts  story-dependency.ts
    routes/
      +page.server.ts         # board list (load)
      [rfc]/+page.server.ts   # one board: load RFC + includes(stories, assignee)
      [rfc]/+page.svelte      # columns + cards
      api/stories/+server.ts  # JSON API route demo
```

CLI db tasks (`db:setup` / `db:migrate` / `db:rollback`) reuse the
`twitter-clone` pattern — a `src/cli.ts` over the public migrator API — so the
example does not re-implement migration discovery.

## Alternatives considered

- **Pure Vite SPA with a wasm SQLite adapter.** Rejected: no browser/wasm
  adapter exists, and writing one is far out of scope. AR is server-side.
- **Next.js / Remix instead of SvelteKit.** Either would also work as a
  server-side host, but SvelteKit is genuinely Vite-based, so it satisfies the
  README's literal "Vite example" wording; form actions + `load` map cleanly to
  the validations + eager-loading story we most want to show.
- **A second Express example.** Rejected: `twitter-clone` already covers
  server-rendered Express; the gap is a modern full-stack framework.
- **A non-dogfood domain (todo, blog).** Rejected: the tasks/RFC Kanban domain
  naturally needs enums, self-referential `through`, scopes, and transactions —
  the exact wide AR slice we want — and mirrors how the project runs.

## Rollout

Ordered phases, each filed as a follow-on story under this RFC. The
RFC-authoring story (`sveltekit-kanban-example-rfc`, RFC 0003) is closed when
this RFC is finalized.

1. **Phase 1 — scaffold + bootstrap:** `sveltekit-kanban-scaffold`
   (SvelteKit app, `config/database.ts`, `hooks.server.ts` boot, `db.ts`).
2. **Phase 2 — schema + models:** `sveltekit-kanban-migrations-models`
   (migrations, the four models with associations/enums/scopes/validations,
   `db/schema.ts` dump, seeds).
3. **Phase 3 — routes + UI:** `sveltekit-kanban-routes-ui`
   (board `load`, form actions for create/move/claim/reorder, `+server.ts` API
   route, Svelte columns/cards, validation-to-field-error rendering).
4. **Phase 4 — docs + CI:** `sveltekit-kanban-readme-ci`
   (README walkthrough; join the deferred `ci-examples-job` lane; link from
   `packages/activerecord/README.md`, replacing the "planned" note).

## Open questions

1. **Location & CI.** Recommendation: live at `examples/sveltekit-kanban/` and
   join the deferred `ci-examples-job` lane (RFC 0003 §Deferred). The job stays
   lightweight — build packages, `db:setup`, `pnpm typecheck`, and a smoke run.
2. **Smoke harness.** `twitter-clone` has a no-HTTP `pnpm smoke`. Recommendation:
   provide an equivalent that drives the model/transaction layer directly under
   `TRAILS_ENV=test` (in-memory DB), independent of the SvelteKit dev server, so
   CI need not boot a browser.

## Changelog

- 2026-06-17: initial RFC
