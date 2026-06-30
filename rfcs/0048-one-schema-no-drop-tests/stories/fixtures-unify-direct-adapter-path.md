---
title: "Converge the legacy direct-adapter fixture path onto fixtures()"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: [fixtures-additive-surface]
deps-rfc: []
est-loc: 400
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

# Converge the legacy direct-adapter fixture path onto `fixtures()`

Converges the second alternate surface — the legacy direct-adapter path — onto
the Rails `fixtures()` added by `fixtures-additive-surface`. **This is a path
deletion, not a rename**: the substantive change is removing the direct-adapter
path, not changing names.

## Context

Two fixture-wiring styles exist. `fixtures-additive-surface` establishes
`fixtures()` over the handler-resolved path (the correct one). The remaining
alternate is the **legacy direct-adapter** path:
`useFixtures(map, () => getAdapter(), { schema })` (test-helpers/use-fixtures.ts)
— it stands tables up via `defineSchema(getAdapter(), …)` per file instead of
going through the real connection pool. Only **6 files** still use it directly.

The `{ schema }` arg only exists to drive that per-file `defineSchema` slice
(use-fixtures.ts:434-437); on canonical tables (already built into the template
clone) it is redundant, and it is exactly the bespoke-era escape hatch this RFC
retires. (Final default-off lives in `fixtures-drop-schema-arg-default-off`.)

## Acceptance criteria

- [ ] The 6 legacy direct-adapter `useFixtures(..., () => getAdapter(), …)` call
      sites migrated to `fixtures()` (handler-resolved path).
- [ ] The direct-adapter `useFixtures` path / overload is DELETED — the single
      fixture path is the handler-resolved one. (Retain a documented bespoke-table
      escape hatch only if a non-canonical table genuinely needs it.)
- [ ] `test:compare` does not regress; no test names change.

## Notes

- Call this out in each PR as a real merge + deletion, not the mechanical-rename
  exception. Coordinate the old-export removal with
  `fixtures-rename-handler-callsites` (both must hit zero call sites first).
