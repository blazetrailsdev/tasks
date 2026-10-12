---
title: "trails-tsc: enum labels, expression indexes and named primary keys emit wrong declares"
status: in-progress
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: trails#8825
claim: "2026-10-12T18:37:57Z"
assignee: "trails-tsc-emits-invalid-declares-for-a-real-app"
blocked-by: null
closed-reason: null
---

## Context

Running `trails-tsc --noEmit` against trailmap (a vendored-tarball consumer,
`@blazetrails/activerecord-cli` packed at trails `58e3c64148`) reports 761
errors where plain `tsc` reports none. Three defects in
`packages/activerecord-cli`, all found on real trailmap models and schemas:

1. **An enum label that is not an identifier emits invalid syntax.**
   `Story` declares `this.enum("status", { ..., "in-progress": "in-progress" })`.
   `renderEnum` (`src/type-virtualization/synthesize.ts`) builds method names
   from the raw label, so the virtualized file gets `declare isIn-progress`,
   `declare in-progressBang`, `declare static in-progress` — a syntax error
   that takes the whole class with it. The runtime never defines a callable
   member by that name: `packages/activerecord/src/enum.ts:280` mirrors Rails'
   `method_friendly_label = label.gsub(/[\W&&[:ascii:]]+/, "_")`
   (`vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb:270`) and
   defines `isInProgress` / `inProgressBang` / `inProgress` / `notInProgress`.
2. **`t.index("<expression>", …)` becomes a column.** `parseColumnStatement`
   (`src/tsc-wrapper/schema-ts-parser.ts`) treats every `t.<method>("name")`
   as a column except `checkConstraint`, so trailmap's
   `t.index("lower((login)::text)", …)` surfaces as
   `get "lower((login)::text)"(): unknown | null`, and a string-argument
   `t.index("login")` would overwrite the real `login` column with type
   `index` (`unknown`).
3. **A named primary key is emitted as `id`.** `synthesizePk` ignores the
   name in `{ primaryKey: "key", id: "string" }` (trailmap's `meta` and
   `settings` tables) and records `id: bigint`; `key` is never surfaced, so
   `meta.key` is a TS2339 unless hand-declared.

## Acceptance criteria

- An enum label with non-word characters surfaces its predicate, bang and
  scopes under the method-friendly alias the runtime defines; no invalid
  member name is emitted. Covered in `virtualize.trails.test.ts`.
- `t.index`, `t.foreignKey`, `t.exclusionConstraint` and `t.uniqueConstraint`
  never produce or overwrite a column. Covered in `schema-ts-parser.test.ts`.
- `{ primaryKey: "<name>", id: "<type>" }` yields a `<name>` column of that
  type and no `id`. Covered in `schema-ts-parser.test.ts`.
- `trails-tsc --noEmit` on trailmap at its current pin reports 0 errors.
