---
title: "CollectionProxy#clear should be delete_all + self"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into collection-proxy-delete-destroy-delegate-to-association — same mechanism (proxy method delegates to @association, collection_proxy.rb:620-622, 692-694, 1066-1069), adjacent methods, one read of the file"
---

## Context

Rails' `CollectionProxy#clear` is two lines (`collection_proxy.rb:1066-1069`):

```ruby
def clear
  delete_all
  self
end
```

trails' `packages/activerecord/src/associations/collection-proxy.ts` `clear()`
(around :2680) is ~80 lines: it re-derives the dependent strategy
(`dep === "destroy" || "delete" || "delete_all" || "deleteAll"`), branches on
`_isThrough` and `_relationStateDiverged()`, reaches into the association's
`loadTarget`/`deleteRecords` directly, calls `_buildNullifyUpdates()` /
`super.updateAll` / `scope().deleteAll`, and decrements the counter cache
itself — i.e. the same dispatch `deleteAll` reimplemented a second time.

PR #6387 converged `deleteAll` to `@association.delete_all(dependent).tap {
reset_scope }` (`collection_proxy.rb:474-476`), so `clear` can now simply call
it. `clear` also returns `self` in Rails; trails returns `void`.

## Acceptance criteria

1. `CollectionProxy#clear` is `await this.deleteAll(); return this;` — no
   strategy derivation, no through branch, no counter-cache handling of its own.
2. The `isNullScope()` short-circuit is either shown to be covered by the
   association path (`scope.none!`, `collection_association.rb:300-305`) or kept
   with a Rails cite at the call site.
3. `clear` returns the proxy (Rails' `self`), and the existing `clear` tests
   still pass.
4. `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; no new baseline
   rows.
