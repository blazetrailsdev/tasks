---
title: "@association_cache holds ad-hoc object literals Rails has no counterpart for"
status: draft
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two trails call sites seed `@association_cache` with a minimal object literal
that is not an `Association` at all — it implements only `target`,
`_explicitTarget`, `isLoaded()` and `setTarget()`:

- `packages/activerecord/src/associations.ts:599-614` (`_cacheSingularTarget`'s
  fallback for an inverse name with no declared singular reflection)
- `packages/activerecord/src/support/seed-association-cache.ts:35-46` (the
  `catch` arm for an undeclared name)

Rails' `@association_cache` only ever holds `Association` instances built by
`Base#association` from a reflection
(`vendor/rails/activerecord/lib/active_record/associations.rb:290-296`), and
`set_inverse_instance` (`association.rb:170-176`) writes through
`inversed_from` on such an instance. There is no "ad-hoc holder" shape.

These holders are why callers must probe defensively —
`syncAssociationInstance` (`associations/instance-methods.ts:53-64`) calls
`isCollection?.()` optionally "because `_associationInstances` also holds
minimal ad-hoc holders", and PR #6685's `CollectionProxy` constructor does the
same. They were also named as the root cause in
`retire-collection-proxy-own-seat`.

## Converged shape

- Every `@association_cache` entry is an `Association` instance built from a
  reflection, as `associations.rb:290-296` builds them.
- An inverse name with no declared reflection is not cached at all (Rails
  cannot reach that state: `inverse_of` resolution yields a reflection or
  nothing — `reflection.rb`'s `inverse_of`), rather than cached under an
  invented shape.
- The optional `isCollection?.()` probes at the call sites above become plain
  `isCollection()` calls once no non-Association can be in the map.

## Acceptance criteria

- [ ] No object literal is written into `_associationInstances`.
- [ ] `isCollection?.()` optional probes over `_associationInstances` entries
      become unconditional.
- [ ] Association, inverse, preload, autosave and nested-attributes suites stay
      green on SQLite, PostgreSQL and MySQL/MariaDB.
