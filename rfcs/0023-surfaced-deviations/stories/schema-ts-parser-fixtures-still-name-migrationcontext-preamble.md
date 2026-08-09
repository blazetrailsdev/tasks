---
title: "schema-ts-parser fixtures still spell the old MigrationContext defineSchema preamble"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity convergence: the fixtures spell trails' own defineSchema preamble (a trails invention slated for removal), not any Rails shape; nothing fails today since they are parser input strings."
---

## Context

PR #5793 changed the generated schema-file preamble from
`defineSchema(ctx: MigrationContext)` to `defineSchema(ctx: DatabaseAdapter)` in
both emitters — `packages/activerecord/src/schema-dumper.ts:653-660` and
`packages/activerecord/src/support/schema-file-generator.ts:121-123` — because
`DatabaseTasks#loadSchema` now passes the adapter straight into the loaded
function.

The `activerecord-cli` parser fixtures were not updated and still spell the old
preamble: `packages/activerecord-cli/src/tsc-wrapper/schema-ts-parser.test.ts`
has 14 inline fixtures reading
`export default async function defineSchema(ctx: MigrationContext) {`. They are
parser _input_ strings (never compiled), so nothing fails today — but they no
longer mirror what the dumper actually emits, which is the whole point of those
fixtures. Once `delete-drained-migrationcontext-schema-dsl` removes the class,
they will name a type that does not exist.

## Acceptance criteria

- The `schema-ts-parser.test.ts` fixtures spell the preamble the emitters
  actually produce (`ctx: DatabaseAdapter`).
- No test renames; parser behavior and assertions unchanged.
- A guard (or a comment pointing at the emitter) so the two stay in step, if one
  can be added cheaply — otherwise note the coupling in the fixture header.
