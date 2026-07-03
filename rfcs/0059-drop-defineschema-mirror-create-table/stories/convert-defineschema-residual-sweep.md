---
title: "Residual sweep: resolve defineSchema calls in the 24 orphan test files (delete canonical-ride, convert bespoke)"
status: ready
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: ["create-table-canonical-schema-loader"]
deps-rfc: []
est-loc: 300
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails
fidelity above all else.** Residual sweep — the phase-3 clusters shipped their
low-risk conversions and split the hard cases into follow-up stories, but a set
of `defineSchema` residuals fell through and is owned by NO story. Phase 4
(`retire-defineschema-and-one-schema-apparatus`) is gated on
`git grep -c defineSchema` -> 0, so these block the terminal cleanup.

24 `.test.ts` files still contain live `defineSchema(` calls (~30 total), not
named by any other RFC 0059 story (verified 2026-07-03). Most are trivial
**canonical-ride no-ops** — e.g. `numeric-data.test.ts`'s
`defineSchema({ numeric_data: TEST_SCHEMA.numeric_data })` is a cache-hit against
the phase-1 boot loader and should simply be deleted. A few are likely
**genuinely bespoke** and need a real `create_table` + teardown mirroring the
Rails test — check these first: `migration.test.ts` (3), `transaction-isolation.test.ts`
(3), `test-helpers/canonical-schema.test.ts` (2).

Full list:

- adapters/postgresql/foreign-table.test.ts
- associations/getmodelcolumns-virtual-projection.test.ts
- base-prevent-writes.test.ts
- column-alias.test.ts
- column-names-sync-virtual-exclusion.test.ts
- encryption/extended-deterministic-queries.test.ts
- encryption/unencrypted-attributes.test.ts
- finder-respond-to.test.ts
- i18n.test.ts
- migration.test.ts (3)
- model-schema.test.ts
- multiparameter-attributes.test.ts
- numeric-data.test.ts
- relation/mutation.test.ts
- relation/value-accessor-semantics.test.ts
- secure-password.test.ts
- secure-token.test.ts
- signed-id.test.ts
- statement-invalid.test.ts
- test-helpers/canonical-schema.test.ts (2)
- transaction-isolation.test.ts (3)
- type/date-time.test.ts
- types.test.ts
- validations/length-validation.test.ts

## Acceptance criteria

- Every listed file's `defineSchema(` call resolved: delete the canonical-ride
  no-ops (tables come from the phase-1 boot loader); convert genuine bespoke
  tables to `connection.createTable(...)` + teardown, mirroring the Rails test.
- `git grep -c defineSchema packages/activerecord/src -- '**/*.test.ts'` for
  these files -> 0.
- No test renames; `test:compare` delta >= 0.
- One PR per area / <=500 LOC; file follow-ups per the epic rule, do not stack.
  (Comment/import-only mentions in other files are NOT in scope — only live calls.)
