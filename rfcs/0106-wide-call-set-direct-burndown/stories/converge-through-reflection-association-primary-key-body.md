---
title: "converge-through-reflection-association-primary-key-body"
status: done
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6839
claim: "2026-08-21T20:50:32Z"
assignee: "converge-through-reflection-association-primary-key-body"
blocked-by: null
closed-reason: null
---

# `ThroughReflection#associationPrimaryKey` answers the source reflection's key, not Rails' `primary_key(klass || self.klass)`

## Context

Surfaced while converging `associationPrimaryKeyFor` onto Rails'
`association_primary_key(klass = nil)` in PR #6832.

Rails (`activerecord/lib/active_record/reflection.rb:1083-1090`):

```ruby
def association_primary_key(klass = nil)
  if primary_key = actual_source_reflection.options[:primary_key]
    @association_primary_key ||= -primary_key.to_s
  else
    primary_key(klass || self.klass)
  end
end
```

trails (`packages/activerecord/src/reflection.ts`, `ThroughReflection`) instead
asks the source reflection:

```ts
return (
  this.sourceReflection?.associationPrimaryKey(klass) ?? this._delegate.associationPrimaryKey(klass)
);
```

The two disagree for a query-constraints source. `Sharded::BlogPost#tags` is
`has_many through: :blog_post_tags`, whose source `belongs_to :tag` targets
`Sharded::Tag` — query constraints `[blog_id, id]`, own `primary_key` `"id"`.
Rails answers `"id"`; trails answers `["blog_id", "id"]`.

The trails answer is what
`packages/activerecord/src/associations/has-many-through-association.ts`'s
`primaryKeyValue` (a trails method with no Rails counterpart — Rails'
`CollectionAssociation` has no `primary_key_value`) and the delete/find
comparison paths in `collection-association.ts` are built on, and
`has-many-through-associations.test.ts`'s
`"through association resolves composite source association primary key"`
enshrines it. Converging `ThroughReflection` alone reds that test — verified on
PR #6832's branch.

## Converged shape

Converge the cluster, not the one method:

1. Port `ThroughReflection#association_primary_key` verbatim, including the
   `actual_source_reflection.options[:primary_key]` arm and its memoization.
2. Rework the delete/find comparison paths to key off whatever Rails keys off —
   most likely `reflection.klass.composite_query_constraints_list` at the
   comparison site rather than a widened `association_primary_key` — and retire
   `HasManyThroughAssociation#primaryKeyValue` if Rails has no counterpart for
   it.
3. Re-derive the enshrining test's expectation from the Rails behaviour rather
   than the current trails one.

## Acceptance criteria

- [ ] `ThroughReflection#associationPrimaryKey` is Rails' body, with Rails'
      memoization, and the JSDoc deviation note added in #6832 is gone.
- [ ] `has-many-through-associations.test.ts` composite/CPK cases pass on all
      three adapters with the Rails-derived expectations.
- [ ] `parity:api:extra --package activerecord` does not gain names;
      `primaryKeyValue` is gone or justified.
