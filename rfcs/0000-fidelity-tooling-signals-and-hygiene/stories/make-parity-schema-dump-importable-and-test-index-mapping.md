---
title: "parity schema dump: make importable and test the native index mapping"
status: ready
updated: 2026-08-28
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/schema/node/dump.ts` applies a fixture's `schema.sql` to a
temp SQLite database, introspects it through the trails AR adapter, and
canonicalizes the result for the schema-parity comparison. None of it is unit
tested: the module calls `main()` at import time
(`dump.ts:173`, `main().catch(...)`), so importing it from a test runs the whole
dump — a `better-sqlite3` handle, an `establishConnection`, a temp dir.

PR #5723 fixed a real bug in it while clearing the `scripts/tsconfig.json`
type errors, and could not add a regression test for that reason. The bug:
`introspectIndexes` types `columns` as `string | string[]`, and Rails'
`IndexDefinition#columns` is likewise a bare String for an expression index
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:9,14`).
`dump.ts` passed it through unchanged into `NativeIndex.columns` (declared
`string[]`), so `canonicalize.ts:124` read `.length` off the string as a column
count and `:129` cast the bare string to `[string, ...string[]]`. The fix
(`dump.ts:108`) wraps a string into a one-element list; it currently rests on
the type declaration alone.

`canonicalize.ts` itself is well covered by `canonicalize.test.ts` — the gap is
specifically the native-introspection-to-`NativeDump` mapping in `dump.ts`.

## Acceptance criteria

- `dump.ts` becomes importable without side effects: guard the `main()` call so
  it runs only when the module is the entry point, and export the
  native-dump mapping (the `idxDefs.map` / `cols.map` bodies) as named
  functions.
- A `dump.test.ts` covers the expression-index case — an index whose `columns`
  arrive as a bare SQL string must land in `NativeIndex.columns` as a
  one-element list — plus the existing named-index guard
  (`dump.ts:101`, the empty-name throw).
- `pnpm parity:schema` (or whatever entry point invokes the script) still
  works unchanged: the entry-point guard must not break the CLI path.

## Notes

Est. 60 LOC: an entry-point guard, two extracted functions, and a focused test
file. No Rails-fidelity risk — this is parity harness code, not ported Rails
behavior.

## Re-verified 2026-08-17 (draft sweep)

Still valid; **path moved**. The module is now
`scripts/parity/pipeline/schema/node/dump.ts` (188 lines), not
`scripts/parity/schema/node/dump.ts`. It still calls `main()` at import
(`:185`, with `main()` defined at `:64`), so it is still un-importable from a
test and the `introspectIndexes` bug still has no regression test.
