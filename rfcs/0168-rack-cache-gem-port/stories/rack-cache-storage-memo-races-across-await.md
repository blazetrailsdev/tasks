---
title: "Rack::Cache::Storage memo races across the createStore await"
status: draft
updated: 2026-11-22
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/rack-cache/lib/storage.ts` `resolveMetastoreUri` / `resolveEntitystoreUri` write
`this._metastores[String(uri)] ||= await this.createStore(...)`. Rails'
`@metastores[uri.to_s] ||= create_store(MetaStore, uri, options)`
(`vendor/rack-cache/v1.17.0/lib/rack/cache/storage.rb:18-24`) is synchronous, so one URI
always resolves to one store. In the port, two concurrent first calls for the same URI
each build a store across the `await` (`Disk.resolve` is async), and the second write
replaces the first. The two callers end up holding different stores.

Memoizing the promise would close the race but would also memoize a rejection. Ruby never
does that, because `fail` (`storage.rb:42`) raises before the `||=` assigns.

## Acceptance criteria

- [ ] Concurrent first `resolveMetastoreUri("file:/x")` calls answer the same store (`toBe`).
- [ ] A raising `createStore` leaves nothing memoized, so a retry calls `createStore` again,
      as Ruby does.
- [ ] Converged shape: keep `||=` at the Rails name and position. For example, memoize the
      in-flight promise and delete the slot when it rejects, or make the Heap/Noop resolve
      path synchronous so that only Disk awaits.
- [ ] `storage.test.ts` keeps the Rails test names, and the call gates add no row.
