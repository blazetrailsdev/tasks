---
title: "Route the generated collection accessor through CollectionAssociation#reader"
status: draft
updated: 2026-08-17
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails generates a collection reader as one line
(`activerecord/lib/active_record/associations/builder/association.rb:102-108`):

```ruby
def self.define_readers(mixin, name)
  mixin.class_eval <<-CODE, __FILE__, __LINE__ + 1
    def #{name}
      association(:#{name}).reader
    end
  CODE
end
```

trails' `Builder::CollectionAssociation.defineReaders`
(`packages/activerecord/src/associations/builder/collection-association.ts:126-142`)
instead installs a getter that calls the RFC 0022 proxy factory directly:
`return association(this, name)` — bypassing `CollectionAssociation#reader`
entirely.

PR #6673 converged `reader` itself onto Rails' four lines
(`collection_association.rb:33-42`), so the two paths now duplicate work: the
factory (`packages/activerecord/src/associations.ts:1806`) calls `resetScope()`
on its cache-hit branch because it is the de-facto reader, and `reader` calls it
again on the read that first builds the proxy. The accessor also never runs the
stale-target `reload`.

## Converged shape

Make the generated getter `this.association(name).reader`, so `reader` is the
single reader and `association()` goes back to being only the
`@proxy ||= CollectionProxy.create(klass, self)` cache. Remove the `resetScope()`
from `associations.ts`'s existing-proxy branch once `reader` owns Rails' fourth
line on both paths.

The blocker to check first: the generated getter is synchronous (callers do
`author.posts.where(...)`, `author.posts[0]`), while `reader` returns a promise
because the stale `reload` issues a query. Either the stale arm has to be
reachable without awaiting on the sync path, or the accessor keeps a sync
fast-path with the reload folded in where it can run.

## Acceptance criteria

- [ ] The generated collection getter routes through `CollectionAssociation#reader`.
- [ ] `resetScope` is called exactly once per read, from `reader`.
- [ ] The redundant `resetScope()` in `associations.ts`'s cache-hit branch is gone.
