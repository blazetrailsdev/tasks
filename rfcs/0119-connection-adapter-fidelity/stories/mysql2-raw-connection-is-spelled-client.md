---
title: "mysql2 spells @raw_connection as _client, so disconnect!/discard! name neither Rails statement"
status: in-progress
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 120
pr: 7659
claim: "2026-09-10T11:42:32Z"
assignee: "mysql2-and-pg-begin-deferred-transaction-drop-the-isolation-level"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mysql2Adapter#disconnect!` names the raw connection twice
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:123-129`):

```ruby
def disconnect!
  @lock.synchronize do
    super
    @raw_connection&.close
    @raw_connection = nil
  end
end
```

`discard!` does the same at `:131-137` (`@raw_connection&.automatic_close = false;
@raw_connection = nil`).

trails' Mysql2Adapter has no `_rawConnection` at all. Its handle lives behind a
private accessor spelled `_client`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:92-96`), a thin
getter/setter pair over the base `_connection` slot — exactly the shape sqlite3
(`sqlite3-adapter.ts:187-193`) and PostgreSQL
(`postgresql-adapter.ts:322-328`) expose under the RAILS name after RFC 0013
Phase 3 (`phase3-unify-connection-slot`, PR #3090). mysql2 was never converged
with them.

The consequence is that no line in mysql2's `disconnect!`/`discard!` spells
Rails' `@raw_connection`. The close-and-nil pair is buried inside a
`_closeRawHandle()` helper with no Rails counterpart
(`mysql2-adapter.ts:704-713`), so a reader comparing the two bodies cannot see
Rails' two statements at all — and `isConnected()` reads `this._client !== null`
where Rails reads `@raw_connection`.

Surfaced while converging `disconnectBang` onto the adapter lock in PR #7634
(story `disconnect-bang-drops-the-lock-and-nils-the-connection`): that PR had to
leave the nil inside `_closeRawHandle()` rather than write Rails'
`this._rawConnection = null`, because the name does not exist on this adapter.

## Converged shape

Rename mysql2's private `_client` accessor pair to `_rawConnection`, matching
sqlite3 and PostgreSQL, and inline the close-and-nil so `disconnectBang`'s body
reads as Rails' three statements:

```ts
override async disconnectBang(): Promise<void> {
  await this.lock.synchronize(async () => {
    await super.disconnectBang();
    this._connectGeneration++;
    this._rawConnection?.end().catch(() => {});
    this._rawConnection = null;
  });
}
```

`_closeRawHandle()` has no Rails counterpart and is called from `reconnect` too,
so either fold it into both call sites or keep it and have it spell
`_rawConnection`. `_connectGeneration` is the trails-only connect/teardown race
guard whose PG twin is settled prior art
(`pg-disconnect-close-inflight-acquire-adoption-race`, PR #4842) — keep it.

## Acceptance criteria

- [ ] mysql2's raw-connection accessor is spelled `_rawConnection`, over the same
      `_connection` slot, matching `sqlite3-adapter.ts:187-193` and
      `postgresql-adapter.ts:322-328`.
- [ ] `disconnectBang` and `discardBang` name `_rawConnection` for the close and
      the nil, in Rails' statement order (`mysql2_adapter.rb:123-137`).
- [ ] `isConnected()` reads `_rawConnection`, mirroring Rails' `@raw_connection`.
- [ ] No remaining `_client` references in `mysql2-adapter.ts`; MySQL and MariaDB
      lanes green.
