---
title: "parity: the call gate credits a .length property read as Array#size"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

Four bodies read `.length` where Rails calls `size` on an Array, and carry
`@missingRailsCall size`:

| Rails site                                                                                                                                                 | Receiver kinds  | TS body                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches.rb:306,310` `Array(start).size != cursor.size` (`ensure_valid_options_for_batching!`) | `expr`, `local` | `Array(start).length !== cursor.length`        |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:611` `result.columns.size != columns.size` (`type_cast_pluck_values`)         | `expr`, `local` | `result.columns.length !== columns.length`     |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:379` `c.select_rows(…).size == 1` (`exists?`)                               | `expr`          | `(await c.selectRows(…)).length === 1`         |
| `finder_methods.rb:426,432` `Array.wrap(ids).size == 1`, `not_found_ids.size` (`raise_record_not_found_exception!`)                                        | `expr`, `local` | `wrap(ids).length === 1`, `notFoundIds.length` |

The TS files are `packages/activerecord/src/relation/batches.ts`, `relation/calculations.ts` and
`relation/finder-methods.ts`. There is nothing to change in them: `.length` is the only JS
spelling of `Array#size`, and the naming gate already files `size` → `length` permanent
(`NO_JS_EQUIVALENT`, `scripts/api-compare/naming-taxonomy.ts`).

`scripts/api-compare/compare.ts`'s `significantCallsForReceivers` drops `size` from
significance only when every Ruby site of it in the body is provably an `array`.
`call-gate-proves-array-literal-ivars-and-kernel-array-receivers` adds the `Kernel#Array(...)`
proof, which covers one site of the `batches.rb` row; none of the four bodies is all-proven,
because each mixes that site with a `local` or an unprovable `expr`
(`select_rows(...)`, `result.columns`).

The note above `NO_JS_CALL_FORM` in `compare.ts` refuses a blanket `size` suppression because
a Ruby-side rule cannot tell an Array from a Relation, whose `size` runs a query. The TS side
can: a trails `Relation#size` / `#length` is an awaited method CALL, so a `.length` property
READ in the paired TS body is never a dropped query trigger.

## Acceptance criteria

- [ ] The call gate credits Ruby `size` (and `length`) for a body whose paired TS body reads a `.length` property, only for a property read and never for a `length()` / `size()` call, with unit tests for the read, the call, and a body with neither (which must still flag). A site the Ruby-side proof already drops is unaffected.
- [ ] The four receipts above are deleted and `pnpm parity:api:calls` is green with no baseline row added.
- [ ] Every other `@missingRailsCall size` receipt or baseline row the credit clears is deleted; list them in the PR body.

## Verification

```bash
pnpm vitest run scripts/api-compare && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls
```
