---
title: "Gate extractor: capture !current_adapter? in compound trailing-if conditions"
status: in-progress
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3724
claim: "2026-06-20T16:13:30Z"
assignee: "gate-extractor-compound-if-current-adapter"
blocked-by: null
---

## Context

The Ruby gate extractor (`scripts/test-compare/`, Ruby side feeding
`rails-tests.json`) drops part of a **compound trailing `end if`** condition.

For `persistence_test.rb:1614`:

```ruby
def test_...still_returns_primary_key_after_insert
  ...
end if supports_insert_returning? && !current_adapter?(:SQLite3Adapter)
```

the extractor records only `gate: { features: ["insert_returning"] }` — it
silently discards the `&& !current_adapter?(:SQLite3Adapter)` half. The true
Rails gate excludes SQLite (SQLite satisfies `supports_insert_returning?` at
≥ 3.35.0 but is explicitly excluded), so only PostgreSQL runs it in CI.

Discovered in PR #3718 (story `gate-missing-persistence-prevent-writes`):
the faithful TS gate would be `itIfSupports.skipIf(adapterType === "sqlite")`,
but applying it produces a **`wrong-gate`** mismatch against the extracted
baseline (`rails *|insert_returning` vs `ts mysql,postgresql|insert_returning`).
We had to gate with the plain `itIfSupports("insert_returning")` to classify
`null`, which is less faithful than Rails (runs on SQLite where Rails skips).

This is a measurement-instrument gap, not a one-off: any
`def…end if <supports_X?> && !current_adapter?(…)` (or the `&&`/`||` compound
forms generally) under-reports the adapter dimension, masking real adapter
divergences and forcing less-faithful TS gates.

## Acceptance criteria

- [x] Ruby gate extractor parses compound trailing-`if` conditions combining
      `supports_X?` with `!current_adapter?(...)` (and `current_adapter?(...)`),
      emitting both the `features` and the `adapters` restriction.
- [x] `persistence_test.rb` `model with no auto populated fields still returns
primary key after insert` extracts `features:["insert_returning"]` +
      adapter exclusion of sqlite.
- [x] Re-gate the TS test in `persistence.test.ts` to
      `itIfSupports.skipIf(adapterType === "sqlite")` and confirm
      `test:compare --gates` classifies it `null` (0 wrong-gate).
- [x] Audit other compound-`if` Rails tests for newly-surfaced adapter gates;
      reconcile or register follow-ups.
