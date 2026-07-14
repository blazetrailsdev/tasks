---
title: "uncached-sql-payload-name-nil-passthrough"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

## Context

Surfaced while porting `cacheNotificationInfo`'s name pass-through (story
`cache-notification-info-lazy-binds-and-name-passthrough`, PR pending). That
story fixed the CACHED payload
(`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:588-597`),
which now emits `name` unchanged per
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:313`.

The UNCACHED path still diverges. In Rails, `select_all(arel, name = nil, ...)`
(`abstract/database_statements.rb:69`) passes `nil` EXPLICITLY down to
`log(sql, name, ...)` (`abstract_adapter.rb:1134`), so `log`'s `name = "SQL"`
default never applies and `payload[:name]` stays `nil` for a nameless query.
trails passes `undefined` instead, so the TS default parameter fires and the
uncached payload carries `name: "SQL"`.

Observed directly: in `packages/activerecord/src/query-cache.trails.test.ts`
("does not coerce a nameless query to SQL"), a nameless
`connection.selectAll("select 1")` emits an uncached payload with
`name: "SQL"` and a cached payload with `name: undefined`. The test asserts the
cached side only; converging the uncached side would let it assert the two
match, which is the real Rails invariant.

## Inventory (verified 2026-07-14)

`git grep -n 'name ?? "SQL"' -- packages/activerecord/src --include=*.ts | grep -v test`
finds **18 coercion sites**. They are not all the same kind:

**Payload producers (4)** — these directly put `"SQL"` in the emitted payload and
are the ones the acceptance criteria are about:

- `abstract-adapter.ts:2348` (in `log`; note its sibling line 2350 is the
  `type_casted_binds` param — see
  `type-casted-binds-payload-self-dispatch`, which touches the same function)
- `mysql2-adapter.ts:628`
- `postgresql-adapter.ts:975`
- `sqlite3-adapter.ts:777`

**Call-forwarding sites (14)** — coerce `undefined` → `"SQL"` before passing the
name down, so the coercion is already baked in by the time a producer sees it:

- `abstract/database-statements.ts:474,532,576,1412,1435,1702,1715,1724,1733`
- `postgresql-adapter.ts:2483,2538`
- `sqlite3-adapter.ts:632,1266`
- `sqlite3/database-statements.ts:235`

Fixing only the 4 producers will NOT make a nameless query nil — the forwarding
sites coerce upstream. Both layers have to move together, and each forwarding
site needs checking against its Rails counterpart, since Rails' `log` genuinely
does default `name = "SQL"` when the argument is OMITTED (abstract_adapter.rb:1134);
the divergence is only where Rails passes an explicit `nil`.

## Acceptance criteria

- [ ] A nameless `selectAll` / `selectRows` emits an uncached
      `sql.active_record` payload whose `name` is nil-equivalent, matching
      Rails' explicit-nil pass-through — not the `"SQL"` default.
- [ ] `log`'s `"SQL"` default still applies where Rails' does (i.e. when the
      `name` argument is genuinely omitted by the caller).
- [ ] `query-cache.trails.test.ts` "does not default a null name to SQL" is
      tightened to assert the cached and uncached payload names are equal.
- [ ] LogSubscriber output for nameless queries is checked against Rails'
      `log_subscriber.rb:18-30` rendering of a nil `payload[:name]`.
