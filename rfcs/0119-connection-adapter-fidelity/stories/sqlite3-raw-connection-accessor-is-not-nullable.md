---
title: "sqlite3's _rawConnection accessor is non-nullable, so @raw_connection = nil has no spelling"
status: done
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 140
pr: 7659
claim: "2026-09-10T11:42:32Z"
assignee: "mysql2-and-pg-begin-deferred-transaction-drop-the-isolation-level"
blocked-by: null
closed-reason: null
---

## Context

Rails' `@raw_connection` is nilable on every adapter, and sqlite3's `disconnect!`
depends on it (`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:221-226`):

```ruby
def disconnect!
  super

  @raw_connection&.close rescue nil
  @raw_connection = nil
end
```

trails' sqlite3 accessor pair declares the slot NON-nullable
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:187-193`):

```ts
get _rawConnection(): SqliteConnection {
  return this._connection as unknown as SqliteConnection;
}
set _rawConnection(value: SqliteConnection) {
  this._connection = value as unknown as AbstractAdapter | null;
}
```

The type is a lie in both directions. The getter claims non-null over a slot that
is `null` before `connect!` and after `disconnect!` — which is why callers in the
same file already guard it with `?.`
(`:199`, `:204`, `:454`, `:464`, `:468`, `:600`, `:604`), a shape tsc should be
rejecting rather than permitting. And the setter accepts no `null`, so Rails'
`@raw_connection = nil` has no spelling: PR #7634 had to reach past the accessor
and write the base slot directly, `this._connection = null`
(`sqlite3-adapter.ts:_disconnect`), where every other adapter writes
`this._rawConnection = null` (`postgresql-adapter.ts:1287,1300,1344`).

Surfaced in PR #7634 (story
`disconnect-bang-drops-the-lock-and-nils-the-connection`) while moving the nil out
of the abstract body into the subclass per `sqlite3_adapter.rb:224-225`.

## Converged shape

Widen the pair to `SqliteConnection | null`, mirroring the PostgreSQL accessor
(`postgresql-adapter.ts:322-328`, which is already `pg.Client | null`), and let
the nil be written at the Rails name:

```ts
get _rawConnection(): SqliteConnection | null { ... }
set _rawConnection(value: SqliteConnection | null) { ... }
```

Then `_disconnect()` spells Rails' second and third statements directly, and the
existing `?.` guards typecheck honestly. Expect tsc to surface the call sites
that assumed non-null; each is either a genuine guard Rails also has (`&.`) or a
site that must route through `sqliteConnection()` / `ensureConnected()` — which
already returns a connected handle and is the analogue of Rails naming
`@raw_connection` after `connect!`.

## Acceptance criteria

- [ ] sqlite3's `_rawConnection` getter and setter are `SqliteConnection | null`.
- [ ] `_disconnect()` nils via `this._rawConnection = null`, not
      `this._connection = null`, matching `sqlite3_adapter.rb:225`.
- [ ] Every call site tsc surfaces is resolved with a guard Rails also has, or by
      routing through `sqliteConnection()`; no `as unknown as` cast is added to
      silence one.
- [ ] All three adapter lanes green.
