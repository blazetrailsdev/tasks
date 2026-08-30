---
title: "156 duplicate test paths credit once and count the rest as TS-only extra"
status: draft
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured while auditing PR #7265: **156 test cases across the manifest share an
identical `path` (ancestors + description) with a sibling in the same file**, so
`parity:test` can credit only one of them against the Rails name and the rest
read as `extra (TS only)`. None come from loop expansion — they are hand-written
tests that repeat a name inside one `describe`. Sample from
`scripts/test-compare/output/ts-tests.json`:

- `packages/arel/src/table.test.ts` — `TableTest > should create join nodes with
a klass` ×3.
- `packages/activerecord/src/associations/has-many-associations.test.ts` —
  `deleting updates counter cache with dependent destroy` ×3, `create with bang
on has many when parent is new raises` ×2.
- `packages/arel/src/attributes/math.test.ts` — five names ending `should be
compatible with ` (a trailing-space title) each ×2.
- `packages/arel/src/attributes/attribute.test.ts` — `AttributeTest > #eq_all >
should create a Grouping node` ×2.
- `packages/activerecord/src/associations/eager-load-includes-full-sti-class.test.ts`
  — four top-level names ×2.

`math.test.ts`'s trailing-space names suggest the underlying Rails names carry a
suffix that was dropped in the port, which would make these a naming fidelity
miss rather than a genuine duplicate.

## Converged shape

Per duplicate group, read the Rails counterpart (`pnpm rails:find <name>`) and
determine which of the two applies:

- **The Rails names differ** and the port collapsed them — restore the Rails
  spelling on each, verbatim. This is the expected outcome for `math.test.ts`'s
  `should be compatible with ` family and for the `#eq_all` group, whose Rails
  twins are distinguished by the operand.
- **Rails genuinely has one test** and the TS file split it into several — fold
  them back into one `it()` with the Rails name, or move the extra coverage to a
  `.trails.test.ts` sibling, per
  `feedback_ts_only_extras_go_in_trails_test_file`.

Never rename a test to a name Rails does not have — CLAUDE.md's "NEVER rename or
reword test names" applies; the fix is to restore the Rails name, not to invent a
disambiguator.

## Acceptance criteria

- Duplicate identical `path`s in `output/ts-tests.json` drop from 156 toward 0
  (bundle by file; this is larger than one PR — file per-file follow-ups rather
  than widening a single one).
- Each converged group's tests match their Rails names, leaving the `extra (TS
only)` column.
- `compare.ts --gates --check` and the assertion-mismatch ratchet stay green.
