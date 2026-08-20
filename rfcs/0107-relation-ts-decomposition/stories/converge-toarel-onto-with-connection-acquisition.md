---
title: "toArel acquires through a with_connection port, retiring the { sanitizeLimit } stand-in (query_methods.rb:1595)"
status: done
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 10
pr: 6756
claim: "2026-08-20T01:52:31Z"
assignee: "derive-collection-proxy-delegate-list-from-mixin-keys"
blocked-by: null
closed-reason: null
---

## Context

Rails' `arel` reader acquires a connection and hands it to `build_arel`:

```ruby
def arel(aliases = nil)
  @arel ||= with_connection { |c| build_arel(c, aliases) }
end
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1595`;
`update_all` / `delete_all` do the same inside their own
`model.with_connection` block, `relation.rb:1023`.) So `build_arel` never sees a
missing connection, and `connection.sanitize_limit(limit_value)`
(`query_methods.rb:1757`) needs no guard.

PR #6610 (`build-arel-connection-never-null`) made `buildArel`'s `connection`
parameter REQUIRED and collapsed the limit line to
`connection.sanitizeLimit(this.limitValue)`, matching `:1757` exactly. It did
that via the story's option 2 (name the connectionless case at the call site)
rather than option 1 (port `with_connection` at the reader), because trails has
no synchronous `with_connection` acquisition seam and `Relation#toArel` is
synchronous.

What ships today (`packages/activerecord/src/relation.ts`, `toArel`):

```ts
return this.buildArel(this._resolveAdapter() ?? { sanitizeLimit }, aliases);
```

plus the sibling in `buildFrom`'s duck-typed subquery arm
(`packages/activerecord/src/relation/query-methods.ts`):

```ts
resolved.buildArel({ sanitizeLimit });
```

`_resolveAdapter()` swallows `ConnectionNotEstablished` and returns null, so the
substituted object stands in for a real connection. That object literal is the
remaining deviation: Rails has one acquisition point and one connection.

## Converged shape

Port `with_connection` at the `arel` reader so the connection is acquired where
Rails acquires it (`query_methods.rb:1595`), and delete both
`?? { sanitizeLimit }` stand-ins. This needs the connectionless Arel-building
callers resolved first — `_cteBodyArelNode` and `buildFrom`'s subquery path
build Arel on models with no established pool, where `_conn()` raises
`ConnectionNotEstablished`. Either those callers acquire (or fail) the way
Rails' do, or they are shown to be trails-only paths that should not exist.

## Acceptance criteria

- [ ] `Relation#toArel` acquires its connection through a `with_connection`
      port, mirroring `query_methods.rb:1595`.
- [ ] No `{ sanitizeLimit }` stand-in object remains in `relation.ts` or
      `relation/query-methods.ts`.
- [ ] The Arel-building paths that currently run without an established
      connection either acquire one or are removed.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
