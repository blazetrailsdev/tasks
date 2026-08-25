---
rfc: "0003-activerecord-cli"
title: "Standalone ActiveRecord DX + activerecord-cli package"
status: closed
created: 2026-05-29
updated: 2026-06-20
owner: "@deanmarano"
packages:
  - activerecord
  - activerecord-cli
  - trails-tsc
  - trailties
clusters:
  - core
  - cli
  - deferred
---

# RFC 0003 — Standalone ActiveRecord DX + activerecord-cli package

## Summary

Using `@blazetrails/activerecord` **without** the full Trails web stack works,
but a bare-AR user must hand-roll migrations, a `db:*` CLI, config resolution,
and a bootstrap sequence — or pull in `trailties`, which drags `actionpack`/
`rack`/`vite` in for a pure data-layer need. The machinery already exists, but
only at the `trailties` layer. This RFC proposes a new
`@blazetrails/activerecord-cli` package owning generators, the migrator, `init`,
the `db:*` CLI, and the pending-migration check (with `trailties` depending on it
and dropping its duplicates), plus two orthogonal core changes. Born from building
`examples/twitter-clone` (#2638) on bare AR.

## Motivation

A bare-AR user hits real friction: a three-step bootstrap dance
(`establishConnection` → `registerModel` each → `loadSchema` each), required
`registerModel` for `className:`/`through:` resolution, a required `loadSchema`
for zero-attribute models, no pending-migration check, a core
`ApplicationRecord` reflection bug (§Core), and divergent config discovery.

The example re-implemented `discoverMigrations`, the db tasks, and config
resolution that already exist at the `trailties` layer — purely to avoid the
web-stack dependency. That gap is what this RFC closes.

## Design

### Why the friction exists: the Ruby/TS gap

Rails has no bootstrap step beyond `establish_connection`. Everything else rides
on Ruby capabilities with no TS equivalent — Zeitwerk autoload, `constantize`,
`self.inherited`, `method_missing` + lazy `load_schema!`, synchronous DB. So
`registerModel` + `loadSchema` aren't an oversight; they stand in for what TS
lacks. The design embraces that:

- **Registration cannot be automated** in TS. The principled substitute is a
  **generated manifest** (`models/index.ts`) that imports + registers models —
  the stand-in for Zeitwerk; the explicit import is load-bearing.
- **Schema reflection can be lazy** — queries are already async, so the query
  path can `await` a one-shot reflection (the async path works; only the sync
  path deadlocks on in-memory/pool-1).

### New package: `@blazetrails/activerecord-cli`

Owns generators, the migrator, `init`, the `db:*` CLI, and the pending-migration
check. Acyclic dependency graph with a runtime/tooling split:

- `activerecord-cli → activerecord`, `activerecord-cli → trails-tsc`,
  `trailties → activerecord-cli`. No cycles.
- `trails-tsc` is generic and does not import `activerecord`.
- The AR model-scanner + tsc-wrapper **move** from `activerecord` into
  `activerecord-cli` (§relocate), so `activerecord` becomes pure runtime.

### No new `connect()` in core

The durable bootstrap is two things that already exist:

```ts
import { models } from "./models"; // generated barrel → registers on import
await Base.establishConnection(); // existing core API → reads config/database.ts
```

The interim `loadSchema` step lives in generated userland glue (`db.ts`), the
Rails shape; lazy async reflection later deletes it. No core additions for
bootstrap.

### Registration via a generated `models/index.ts`

The manifest imports + `registerModel`s each model, keeping model files pure.
Generators are **incremental** (`ar generate model` appends to the manifest);
only `ar init` and an optional rebuild do a full scan, reusing the relocated
model-scanner. `trails-tsc` may optionally **verify** the manifest is complete at
check-time (read-only — never writes; codegen must not be a type-pass side
effect).

### Config convention

Standardize the bare-AR path on `config/database.ts` keyed by `TRAILS_ENV`
(matching `trailties/database.ts`, which deliberately avoids `NODE_ENV`).
`ar init` scaffolds it; `Base.establishConnection()` reads it with no arguments.

### Core changes (orthogonal to packaging)

- **§6.1 lazy async schema reflection** — `await` a one-shot
  `ensureSchemaLoaded()` on the query path; deletes the explicit `loadSchema`
  step. See [lazy-async-schema-reflection](stories/lazy-async-schema-reflection.md).
- **§6.2 `_abstractClass` own-property fix (bug)** — concrete models under
  `ApplicationRecord` inherit `_abstractClass` via prototype and skip reflection
  (`INSERT … DEFAULT VALUES`). Use an own-property check at the 3 read sites. See
  [abstract-class-own-property-fix](stories/abstract-class-own-property-fix.md).

## Alternatives considered

- **A `connect()` bootstrap helper in core.** Rejected — unnecessary sugar;
  registration belongs in the generated manifest and the interim glue is
  generated userland code (the Rails shape), not hidden core API.
- **Auto-registration via a class-definition hook.** Not possible in TS (no
  `self.inherited`, no `constantize`); the generated manifest is the substitute.
- **`trails-tsc` writes the manifest during type-checking.** Rejected — a
  typechecker that rewrites source dirties git, races watch mode, and fails
  read-only CI. Generation is codegen, not type-checking; verify-only at most.
- **Checked-in scan of the project for the common generate path.** Rejected —
  generators append incrementally (mirroring Rails); only `init`/rebuild scan.

## Rollout

1. **Ready core fixes** (orthogonal, ship anytime):
   [abstract-class-own-property-fix](stories/abstract-class-own-property-fix.md),
   [lazy-async-schema-reflection](stories/lazy-async-schema-reflection.md).
2. **Package** (gated on open questions):
   [cli-package-scaffold](stories/cli-package-scaffold.md) →
   [relocate-tsc-wrapper](stories/relocate-tsc-wrapper.md) +
   [cli-generators-manifest](stories/cli-generators-manifest.md).
3. **Deferred:** [ci-examples-job](stories/ci-examples-job.md).

## Open questions

1. **Binary name.** Does `ar` reuse the `trails` binary name or ship its own?
   (Gates the package stories — RFC stays `draft` until decided.)
2. **Manifest verify.** `trails-tsc` built-in vs a separate ESLint rule?
3. **Generator field DSL.** `field:type`, references, indexes — follow Rails, TBD.
4. **tsc-wrapper relocation depth.** Full move (cleaner end-state, dev-only
   cycle) vs bins-only (low-risk increment, keeps `activerecord`'s `trails-tsc`
   dep). See [relocate-tsc-wrapper](stories/relocate-tsc-wrapper.md).

## Changelog

- 2026-06-04: folded in the composite-FK round-trip residual from the completed
  schema.ts migration docs (RFC 0011 cutover — no separate RFC for shipped work).
- 2026-06-04: folded in 6 post-merge follow-ups (5 ar-cli findings + DatabaseTasks
  P3-5) migrated from `activerecord-gaps.md` during the RFC 0011 cutover.
- 2026-05-29: initial RFC, migrated from
  `trails/docs/activerecord/standalone-activerecord-cli-proposal.md`.
