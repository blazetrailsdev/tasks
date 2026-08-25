---
title: "Converge CollectionAssociation#reader onto reload + CollectionProxy.create"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6673
claim: "2026-08-17T22:18:04Z"
assignee: "converge-collection-association-reader-reload-and-proxy"
blocked-by: null
closed-reason: null
---

# Converge CollectionAssociation#reader onto reload + CollectionProxy.create

## Context

Rails' `CollectionAssociation#reader`
(activerecord/lib/active_record/associations/collection_association.rb:34-43):

```ruby
ensure_klass_exists!
reload if stale_target?
@proxy ||= CollectionProxy.create(klass, self)
@proxy.reset_scope
```

trails' `get reader` (packages/activerecord/src/associations/collection-association.ts)
does only `ensureKlassExists()` and returns `this.target`. The stale-target
reload lives in the separate `asyncReader` (the reload issues a query and the
getter is synchronous), and the proxy is created/cached by
`associationProxy(owner, name)` under RFC 0022 rather than by `reader`, so
neither `reload` nor `CollectionProxy.create` nor `reset_scope` is called here.

Surfaced by RFC 0106 wave 3, which recorded the gap as per-row justifications on
`reader | reload` and `reader | create` in
`call-mismatches-exclude/activerecord/associations/collection-association.json`.

## Converged shape

Collapse the `reader` / `asyncReader` split so one method carries Rails' four
lines, and let it own the proxy the way Rails does (or state precisely which
RFC 0022 invariant blocks that, with the file:line, and `pnpm tasks block`).
Then delete the two rows by hand via `serializeBaseline` and lower the mark with
`pnpm parity:api:calls:tighten`.

## Acceptance criteria

- [ ] `reader` runs the stale reload and returns the proxy, in Rails' order.
- [ ] Both `reader | *` rows deleted; gate green, no `--write`.
