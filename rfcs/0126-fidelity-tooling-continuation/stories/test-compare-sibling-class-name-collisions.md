---
title: "parity:test collapses same-named tests in sibling Ruby classes"
status: done
updated: 2026-08-30
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: 7241
claim: "2026-08-30T14:52:42Z"
assignee: "extra-surface-walkmixin-honours-method-file"
blocked-by: null
closed-reason: null
---

## Context

`parity:test` maps one Ruby test file to one TS file, so two sibling test
classes in the same `.rb` land in a single row and their test names are merged
into one namespace. When both classes define a test with the same name, the two
collapse into one entry and the ported count under-reports.

Concrete case (#5478): `migration/foreign_key_test.rb` holds both
`ActiveRecord::Migration::ForeignKeyTest` and
`ActiveRecord::Migration::CompositeForeignKeyTest`. Both define
`test_foreign_key_exists` (`:474` and `:878`). Porting all 7
`CompositeForeignKeyTest` cases moved the row 22 OK → 28 OK — a delta of 6, not
7 — with no way to tell from the report that the 7th landed.

The TS side already nests correctly (`describe("ForeignKeyTest")` and
`describe("CompositeForeignKeyTest")` under a shared outer describe), and the
Ruby side is unambiguous, so the class name is recoverable on both sides; the
comparison just doesn't key on it.

Impact is under-counting and a misleading "missing" list, not a false pass — but
it makes the acceptance criterion "missing count drops by the number ported"
unverifiable for any file with sibling classes.

## Acceptance criteria

- [ ] Inventory which Rails test files define more than one test class, and how
      many name collisions exist across those siblings (report only — this may
      be the only affected file).
- [ ] `parity:test` keys tests by (class, name) rather than name alone, so
      same-named tests in sibling classes are counted separately.
- [ ] `migration/foreign_key_test.rb` reports 29 OK / 43 missing after the fix
      (the currently-collapsed `test_foreign_key_exists` counted once per class).
- [ ] `--gates --check` still exits 0; totals move only by the de-collapsed
      entries.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
