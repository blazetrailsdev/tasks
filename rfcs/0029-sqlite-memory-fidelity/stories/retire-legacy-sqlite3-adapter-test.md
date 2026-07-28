---
title: "retire-legacy-sqlite3-adapter-test"
status: in-progress
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5497
claim: "2026-07-28T13:11:50Z"
assignee: "retire-legacy-sqlite3-adapter-test"
blocked-by: null
closed-reason: null
---

## Context

Audit finding from `audit-residual-memory-sites` (RFC 0029), bucket 2
(legacy adapter path) — reconciled against RFC 0026 (adapter-layout fidelity).

`packages/activerecord/src/adapters/sqlite3-adapter.test.ts` (12 `:memory:`
sites) sits at a pre-RFC-0026 path and was assumed to duplicate the relocated
`adapters/sqlite3/sqlite3-adapter.test.ts` (20 sites, 77 tests, Rails-verbatim
names).

**Finding: it is not a duplicate port — it is a bespoke trails file.** None of
its test names match Rails. Its blocks are:

- `raw SQL execution`, `transactions`, `Migration integration` — prose-named
  smoke tests (`"creates tables and inserts data"`, `"commits on success"`,
  `"creates indexes"`) with no counterpart in
  `vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb`.
- `lookupCastType` — trails-only unit tests on the type resolver.
- `SQLite3Adapter._isMemoryFilename` — trails-only; `:memory:` here is the
  **subject under test**, fidelity-correct as a literal.
- `SQLite3Adapter pragmas option` — overlaps the relocated file's Rails-named
  `"setting new pragma"` / `"setting invalid pragma"` / `"default pragmas"` and
  the `overriding default * pragma` family.

So the `:memory:` usage is trails-only rather than a fidelity divergence, but
the **file placement** is an RFC-0026 divergence and the pragma block is
genuinely redundant coverage.

## Acceptance criteria

- [ ] The `pragmas option` block is deleted where the relocated
      `adapters/sqlite3/sqlite3-adapter.test.ts` already covers the same
      behavior under Rails-verbatim names; anything it covers that the
      relocated file does not is moved there (or to a `.trails.test.ts`
      sibling if it has no Rails counterpart).
- [ ] `_isMemoryFilename` and `lookupCastType` unit tests move to a
      `.trails.test.ts` file under `adapters/sqlite3/` per the RFC-0026
      layout — they are trails-only and must not sit in a Rails-named path.
      Their `:memory:` literals stay (subject under test).
- [ ] The prose-named `raw SQL execution` / `transactions` /
      `Migration integration` smoke blocks are either retired as redundant
      with the relocated Rails port, or moved to a `.trails.test.ts` sibling
      with a note on what they cover that the port does not.
- [ ] `packages/activerecord/src/adapters/sqlite3-adapter.test.ts` no longer
      exists at that path.
- [ ] No test names are reworded in the process (move, do not rename).
