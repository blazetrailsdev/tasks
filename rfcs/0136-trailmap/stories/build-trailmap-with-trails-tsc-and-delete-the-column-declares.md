---
title: "trailmap: build with trails-tsc and delete the 69 column declares a schema covers"
status: closed
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  ["trails-tsc-emits-invalid-declares-for-a-real-app", "trails-tsc-reads-more-than-one-schema-file"]
deps-rfc: []
est-loc: 160
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "duplicate of typecheck-trailmap-with-trails-tsc-and-drop-model-declares, which predates it; the measurements are in this story's body and in ~/github/blazetrailsdev/trailmap-trails-tsc-finding.md"
---

## Context

trailmap hand-writes 142 `declare` lines across 14 models; 43 of them are
snake_case column names, which review has objected to twice (trailmap#53,
trailmap#62) under "camelCase, everywhere". trails' `trails-tsc` synthesizes
column members from the schema files so they need not be written.

Measured on a scratch copy at trailmap `0bd03f5` with
`@blazetrails/activerecord-cli` vendored as a tarball:

- It installs and runs from `vendor/` outside the trails workspace; it brings
  its own TypeScript 7.1 nightly as a nested dependency and leaves trailmap's
  5.9 alone.
- 73 column declares (35 of the 43 snake_case ones) can be deleted. With both
  schema files loaded the result type-checks after restoring 4 that carry
  information no schema has: `Rfc#packages`, `#clusters`, `#related_rfcs`
  (`text` columns behind `this.serialize(..., { coder: JsonArray })`, so
  `string[]` not `string | null`) and `ParityDay#gaps` (`jsonb`, typed
  `unknown` by the schema). Net 69 lines deleted.
- The 8 remaining snake_case declares are the stats models
  (`compare-run.ts`, `compare-stats.ts`, `pull-request.ts`), whose schema
  another repository owns. They stay hand-written; `trails-tsc` leaves them
  alone.
- Emit works (`dist/` with `.d.ts`); a cold build is ~13s against ~6s.

What it costs, so it is a decision and not a formality:

- Every tool that type-checks with stock TypeScript sees the deleted members
  as errors — 392 of them under plain `tsc`. That includes any editor, until
  RFC 0035 (tsserver plugin) ships. `pnpm build` and CI must both move.
- Synthesized writers are `set x(value: unknown)`: assignments to a column are
  no longer type-checked. Readers are typed.
- Three types get looser or change: bigint foreign keys become
  `PrimaryKeyValue` rather than `number`, `ParityDay#day` becomes
  `Temporal.PlainDate` rather than `string`, and string columns narrowed by
  hand to a union keep the union only where an `enum` call declares it.
  Check each against what the adapter actually returns before deleting.
- It does not remove snake_case from the code, only from the declarations:
  `repo.owner_id`, `where({ owner_id })` and every serializer key keep the
  column's spelling. CLAUDE.md's rule needs a sentence saying a column is
  spelled as the column, whichever way this story goes.

## Acceptance criteria

- `scripts/vendor-trails.sh` seeds `@blazetrails/activerecord-cli` so a bump
  packs it; the bump is its own PR, per CLAUDE.md.
- `pnpm build` runs `trails-tsc --schema db/schema.ts --schema
db/hub_schema.ts`; CI and the Dockerfile follow.
- Every column declare a schema file covers is deleted, except the four named
  above, each with a one-line reason. Stats-model declares are untouched.
- `pnpm build`, `pnpm test` and `pnpm gate` are green.
- CLAUDE.md states the column-spelling rule and that `pnpm build` is no longer
  stock `tsc`.
