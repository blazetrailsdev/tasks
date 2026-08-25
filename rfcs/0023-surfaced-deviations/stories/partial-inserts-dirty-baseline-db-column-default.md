---
title: "New-record dirty baseline: compare vs DB column default (not model default)"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3784
claim: "2026-06-21T12:30:44Z"
assignee: "partial-inserts-dirty-baseline-db-column-default"
blocked-by: null
---

## Context

Blocking prerequisite for `ar-test-suite-partial-inserts-ambient-divergence`
(flipping the AR test suite to Rails' ambient `partial_inserts = true`).
Surfaced by CI on PR #3745 across all three adapters.

trails' new-record dirty tracking compares each attribute's current value
against the **model's** default (`ctor._defaultAttributes().snapshotValues()` in
`reinstateNewRecordChanges`, called from `callbacks.ts`). Rails instead treats a
new record as dirty relative to the **database column default**. The difference
is invisible under `partial_inserts = false` (full insert) but breaks under
`true`: a user-provided `attribute :x, default: "draft"` equals trails'
model-default baseline → marked unchanged → omitted from the partial INSERT →
the DB stores its own (often NULL) default instead of "draft".

Faithful Rails behavior (passes under `partial_inserts = true`):
`vendor/rails/activerecord/test/cases/attributes_test.rb:241`
"user provided defaults are persisted even if unchanged" — `OverloadedType`'s
model default differs from the schema column default and IS persisted.

CI clusters all trace to this one baseline bug:

- `attributes.test.ts:321` "user provided defaults are persisted even if
  unchanged" (port of attributes_test.rb:241) — expected "draft", got null.
- `encryption/*` — DecryptionError: encrypted-attribute defaults not persisted.
- `counter-cache.test.ts` — counter columns with model default N (DB default
  absent) read 0/-N.

## Approach

Make new-record partial-insert change detection compare against the DB column
default (the column's `default` from schema reflection), as Rails does, so a
model attribute default that differs from the column default is persisted.

CAUTION: `reinstateNewRecordChanges` feeds `_changedAttributes`, which also
drives `saved_changes` / `previous_changes` for every new record — changing the
baseline has blast radius beyond partial inserts. Either (a) change the baseline
and re-verify the dirty/saved_changes suites, or (b) thread a partial-insert-only
baseline so saved_changes semantics are untouched. Decide during implementation.

## Acceptance criteria

- [ ] New-record dirty/partial-insert column selection compares against the DB
      column default, matching Rails.
- [ ] `attributes.test.ts` "user provided defaults are persisted even if
      unchanged" passes under `partial_inserts = true`.
- [ ] Encryption and counter-cache model-default cases persist correctly under
      `partial_inserts = true`.
- [ ] No regression in dirty / saved_changes / previous_changes suites.
