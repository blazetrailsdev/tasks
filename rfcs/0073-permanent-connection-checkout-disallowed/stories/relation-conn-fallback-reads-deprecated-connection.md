---
title: "relation-conn-fallback-reads-deprecated-connection"
status: in-progress
updated: 2026-09-11
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7699
claim: "2026-09-11T15:28:36Z"
assignee: "relation-conn-fallback-reads-deprecated-connection"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while re-measuring the RFC 0073 gate for
`convert-residual-test-connection-call-sites` (gate instrumentation per the
RFC README's Method section, 2026-09-10).

`packages/activerecord/src/relation.ts` `_conn()` falls back to the deprecated
getter:

```ts
private _conn(): DatabaseAdapter {
  return threadedConnectionFor(this._model) ?? this._model.connection;
}
```

It has 12 callers in `relation.ts`, including `deleteAll`
(`relation.ts:767`, `this.buildArel(this._conn())`). Outside a
`with_connection` wrap this reads `Model.connection` on a permanent lease, so
it hits the `permanentConnectionCheckout` gate: 10 hits per run of
`connection-handling.test.ts` alone, all from its `afterEach`
`Post.where({ title: "foo" }).deleteAll()`. With the gate armed as
`disallowed` (Rails' `test/cases/helper.rb:27`) that raises.

Rails' `Relation#delete_all` wraps in `model.with_connection do |c|`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1022`), threading
`c` through the arel build and the `delete` call. The other `_conn()`
callers need the same check against their Rails bodies.

The same fallback shape sits in `packages/activerecord/src/persistence.ts:234`
`_updateRecord` (`threadedConnectionFor(...) ?? this.connection`), 1 hit in the
same measurement. Rails wraps it in `with_connection do |c|`
(`vendor/rails/activerecord/lib/active_record/persistence.rb:277`).

## Acceptance criteria

- `Relation#deleteAll` (and each other `_conn()` caller whose Rails body uses
  `with_connection`) borrows via `withPooledOrDirectConnection` and threads the connection,
  mirroring `relation.rb:1022`.
- `_conn()`'s `this._model.connection` fallback is removed, or each
  remaining caller is justified against its Rails body.
- `persistence.ts` `_updateRecord` borrows via `withPooledOrDirectConnection`
  (the RFC's constraint 1: `withConnection` raises for direct-adapter and HABTM
  models until `retire-direct-adapter-with-connection-shim` lands), mirroring
  `persistence.rb:277`.
- Re-measure with the RFC 0073 gate instrumentation: no hits from
  `relation.ts` or `persistence.ts`.
