---
title: "test:compare collapses same-named tests in sibling Ruby classes"
status: ready
updated: 2026-07-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare` maps one Ruby test file to one TS file, so two sibling test
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
- [ ] `test:compare` keys tests by (class, name) rather than name alone, so
      same-named tests in sibling classes are counted separately.
- [ ] `migration/foreign_key_test.rb` reports 29 OK / 43 missing after the fix
      (the currently-collapsed `test_foreign_key_exists` counted once per class).
- [ ] `--gates --check` still exits 0; totals move only by the de-collapsed
      entries.
