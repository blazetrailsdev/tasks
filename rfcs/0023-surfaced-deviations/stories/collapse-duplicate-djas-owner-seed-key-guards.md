---
title: "Collapse the two divergent DJAS owner-seed null-FK guards onto chain.last.joinForeignKey"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done in substance: both guards now read the chain reflection's joinForeignKey (associations.ts:1214, has-many-association.ts:701-708) — the drift the story names is gone; what remains is a de-duplication refactor Rails has no counterpart for."
---

## Context

Surfaced by the CI regression in PR #6201.

Two entry points into the DJAS chain walk each carry their own copy of the
"owner's seed key is missing" null-FK guard, and they drifted apart:

- `ownerHasUnresolvedThroughKey`
  (`packages/activerecord/src/associations.ts:1206`) — read the OUTER
  reflection's `activeRecordPrimaryKey`.
- the inline check in `findTarget`
  (`packages/activerecord/src/associations/has-many-association.ts:685-698`) —
  reads `_ownerChainReflection(reflection).joinForeignKey`.

They probe the owner for _different columns_. That was invisible until
PR #6201 fixed `ThroughReflection#activeRecordPrimaryKey` to delegate to the
source reflection (`vendor/rails/activerecord/lib/active_record/reflection.rb:973-974`),
at which point the first one started reading the source edge's columns off the
owner and every composite-key DJAS load short-circuited to `[]` on all three
lanes. PR #6201 converged `ownerHasUnresolvedThroughKey` onto the second one's
column source, but both copies still exist.

Rails has neither helper. It seeds the walk once, in
`DisableJoinsAssociationScope#last_scope_chain`
(`vendor/rails/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:18-20`):

```ruby
first_item = reverse_chain.shift
first_scope = [first_item, false, [owner._read_attribute(first_item.join_foreign_key)]]
```

and spells the "no owner key" condition inline at each site it needs it —
`owner.new_record?`, or `CollectionAssociation#null_scope?`
(`collection_association.rb:304`). `ownerHasUnresolvedThroughKey`'s own JSDoc
already concedes it has no Rails counterpart.

## Converged shape

One place reads the owner's seed columns, and it reads
`chain.last.join_foreign_key` — the column `last_scope_chain` actually seeds
from. Collapse the two guards onto it (or, closer to Rails, inline the
condition at each site and delete the extracted helper), so a future change to
the reflection getters cannot silently desynchronize them again.

## Acceptance criteria

- [ ] Exactly one expression in the codebase decides which owner columns the
      DJAS seed reads.
- [ ] Its column source is `chain.last`'s `joinForeignKey`, matching
      `disable_joins_association_scope.rb:20`.
- [ ] A regression test pins the composite-through case that broke in #6201 —
      scalar-PK owner, composite through FK — and fails if a guard reads the
      outer reflection's `activeRecordPrimaryKey` again.
- [ ] All `disable-joins-*` suites green on sqlite, PG and MariaDB.
