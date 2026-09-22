---
title: "Retire syncAssociationInstance's singular arm; association(name) memoizes only"
status: draft
updated: 2026-09-15
rfc: "0155-assertion-surfaced-port-bugs"
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

After trails#7814, `syncAssociationInstance` (`packages/activerecord/src/associations.ts`) returns early for collections. Its singular arm is still there. It copies `_associationCache(name).target`, or a loaded holder's target, onto the `Association` that `record.association(name)` returns. Rails' `association(name)` (`vendor/rails/activerecord/lib/active_record/associations.rb`, `def association`) only memoizes the instance through `association_instance_get` / `association_instance_set`. It has no sync step at all.

## Converged shape

Singular readers and writers use the memoized `Association` target as the one store, so `association(name)` becomes the Rails body and `syncAssociationInstance` is deleted.

## Acceptance criteria

- `syncAssociationInstance` is removed and `association()` matches `associations.rb`.
- The singular association suites (belongs_to, has_one, has_one_through) stay green with no test renames.
