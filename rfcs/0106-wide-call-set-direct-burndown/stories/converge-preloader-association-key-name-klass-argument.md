---
title: "converge-preloader-association-key-name-klass-argument"
status: ready
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `Preloader::Association#association_key_name` drops the `klass` argument

## Context

Surfaced by the leading-underscore call candidate (PR #6825): the widened
candidate list opened the ported-with-args gate on this call, which had kept the
row invisible.

Rails (`activerecord/lib/active_record/associations/preloader/association.rb:161-163`):

```ruby
def association_key_name
  reflection.join_primary_key(klass)
end
```

trails (`packages/activerecord/src/associations/preloader/association.ts:107-109`)
reads `reflection.joinPrimaryKey` as a property and passes no klass.

The argument is not decorative: `join_primary_key(klass = nil)`
(`reflection.rb:944-946`) is
`polymorphic? ? association_primary_key(klass) : association_primary_key`, so a
polymorphic preload resolves its primary key against the CONCRETE class Rails
passes. trails' `joinPrimaryKey` getter (`reflection.ts:1404-1412`) instead
answers `options.primaryKey ?? "id"` on the polymorphic arm, which is a second
divergence in the same place; `joinPrimaryKeyFor(klass)` (`:1398`) already is
Rails' body.

Baselined meanwhile in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/preloader/association.json`.

## Acceptance criteria

- [ ] `associationKeyName` calls Rails' `join_primary_key` body with `klass`.
- [ ] The polymorphic arm of the `joinPrimaryKey` getter is reconciled with
      `joinPrimaryKeyFor` or its divergence justified at the call site.
- [ ] The baseline row above is deleted and the shard mark tightened.
- [ ] Polymorphic preload coverage passes on all three adapters.
