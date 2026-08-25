---
title: "Drop the ?? this.klass fallback in HasManyAssociation#delete_records"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6428
claim: "2026-08-12T17:36:52Z"
assignee: "converge-collection-proxy-rich-reflection-re-resolve"
blocked-by: null
closed-reason: null
---

# Drop the `?? this.klass` fallback in HasManyAssociation#delete_records

## Context

Shipped in PR #6425 (RFC 0084,
`converge-has-many-delete-records-rich-reflection`). Rails:

```ruby
query_constraints = reflection.klass.composite_query_constraints_list
```

(`vendor/rails/activerecord/lib/active_record/associations/has_many_association.rb:132`)

The port
(`packages/activerecord/src/associations/has-many-association.ts`,
`deleteRecords`) now reads `this.reflection.klass`, but keeps a
`?? this.klass` arm because `AssociationDefinition` types `klass` as optional:
an ad-hoc holder built from a macro definition (a through step's synthesised
def, `_buildAssociationInstance`) carries no `klass`. `association(name)`
(`instance-methods.ts:163-166`, Rails `associations.rb:290-296`) hands the real
association the rich reflection, so the fallback fires only for those holders.

## Converged shape

`AssociationDefinition` (or whatever a `HasManyAssociation` is constructed
with) always carries `klass`, so the body is Rails' single expression with no
`??` arm. Likely rides on giving the ad-hoc holders a rich reflection, which is
the same root cause as
[[converge-collection-proxy-rich-reflection-re-resolve]].

## Acceptance criteria

- [ ] `deleteRecords` reads `reflection.klass` with no fallback arm.
- [ ] `klass` is non-optional on the type a `HasManyAssociation` holds, or the
      ad-hoc holder path is shown to be unreachable here.
- [ ] AR association suites green on all three adapter lanes.
