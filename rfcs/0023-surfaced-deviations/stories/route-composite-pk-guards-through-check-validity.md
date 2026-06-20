---
title: "route-composite-pk-guards-through-check-validity"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails raises `CompositePrimaryKeyMismatchError` from exactly one place —
`AbstractReflection#check_validity!`
(`activerecord/lib/active_record/reflection.rb:623,625`), reached via
`Association#initialize` (`associations/association.rb:39`) on first use of an
association. The error message derives from the real reflection's
`active_record_primary_key` / `association_primary_key`.

Trails carries additional, Rails-absent guard raise sites that throw the same
error class from paths that never route through the reflection's
`checkValidityBang`:

- `packages/activerecord/src/associations/association-scope.ts` (2 — joinPks/joinFks length guard in `addConstraints`)
- `packages/activerecord/src/associations/collection-proxy.ts` (2 — polymorphic `<as>_id` scalar-collapse guard)
- `packages/activerecord/src/autosave-association.ts` (4 — save-path guards)
- `packages/activerecord/src/associations.ts` (~12 — inline-fallback loaders + polymorphic `:as` collapse guards)

These were audited in story `composite-pk-mismatch-extra-guard-raise-sites`
and confirmed to be trails-only defensive guards (no Rails equivalent at those
sites). They were left in place and marked as tracked deviations because
removing them would surface silent broken SQL / `readAttribute(undefined)`
instead of a clear error. The message on these paths is derived from
trails-computed join keys rather than Rails' pk/fk accessors.

## Acceptance criteria

- [ ] Route the inline-fallback loaders, autosave save-path, association-scope
      and collection-proxy guard paths through the reflection's
      `checkValidityBang` (the canonical single Rails site) so composite PK/FK
      mismatches are caught once, from the real reflection, with the
      Rails-faithful message.
- [ ] Remove the now-redundant trails-only guard raise sites once the canonical
      validation covers their cases.
- [ ] Keep behavior for the no-reflection fallback paths: if a path genuinely
      cannot build a reflection, document why and keep a minimal guard.
