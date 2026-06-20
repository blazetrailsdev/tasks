---
title: "Converge trails-only CompositePrimaryKeyMismatchError guard raise sites to Rails' single check_validity! site"
status: claimed
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-20T02:30:48Z"
assignee: "composite-pk-mismatch-extra-guard-raise-sites"
blocked-by: null
---

## Context

Rails raises `CompositePrimaryKeyMismatchError` from exactly one place —
`AbstractReflection#check_validity!` (`activerecord/lib/active_record/reflection.rb:623,625`),
always via `CompositePrimaryKeyMismatchError.new(self)` (the real reflection).

Trails has additional, Rails-absent guard raise sites that throw the same error
with a synthetic reflection-shaped object carrying a _pre-resolved_ `primaryKey`
instead of a real reflection:

- `packages/activerecord/src/associations/association-scope.ts` (2 sites — joinPks/joinFks length guard)
- `packages/activerecord/src/associations/collection-proxy.ts` (2 sites — polymorphic `<as>_id` scalar-collapse guard)
- `packages/activerecord/src/autosave-association.ts` (4 sites)
- `packages/activerecord/src/associations.ts` (~12 sites — inline association loaders)

On these paths the message is derived from trails-computed join keys, not from
Rails' `active_record_primary_key`/`association_primary_key`, and they fire in
scenarios where Rails would not raise this error at all. Surfaced while porting
`CompositePrimaryKeyMismatchError` to take a reflection (PR #3690).

## Acceptance criteria

- [ ] Audit each guard raise site against Rails: determine whether Rails raises
      `CompositePrimaryKeyMismatchError` (or anything) on that path.
- [ ] For sites that mirror a real Rails raise, pass the real reflection so the
      message derives from Rails' pk/fk accessors (converge to `new(self)`).
- [ ] For sites with no Rails equivalent, document them as tracked deviations or
      remove them if they mask a different convergence gap.
- [ ] No change to the canonical `checkValidityBang` path (already faithful).
