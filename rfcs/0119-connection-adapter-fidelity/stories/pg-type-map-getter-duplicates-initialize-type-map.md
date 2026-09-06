---
title: "PG typeMap getter lazily rebuilds initialize_type_map's registrations instead of being Rails' bare attr_reader"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Shipped knowingly in PR #7546 and flagged there; filing so it is not left as
prose.

Rails' `type_map` is a plain reader over an ivar that `reload_type_map` fills:

```ruby
# activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:742
attr_reader :type_map

# :359-367
def reload_type_map # :nodoc:
  @lock.synchronize do
    if @type_map
      type_map.clear
    else
      @type_map = Type::HashLookupTypeMap.new
    end
    initialize_type_map
  end
end
```

`reload_type_map` is called at the end of `configure_connection`
(`postgresql_adapter.rb:991`), so by the time anything reads `type_map` it is
populated, and the reader itself does no work.

trails' getter
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`, `get typeMap()`)
instead lazily builds the map AND repeats the synchronous half of
`initialize_type_map` (`postgresql_adapter.rb:744-751`) inline:

```ts
get typeMap(): HashLookupTypeMap {
  if (this._typeMap == null) {
    const m = (this._typeMap = new HashLookupTypeMap());
    (this.constructor as typeof PostgreSQLAdapter).initializeTypeMap(m);
    registerClassWithPrecision(m, "time", TimeType, { timezone: this._defaultTimezone });
    registerClassWithPrecision(m, "timestamp", Timestamp, { timezone: this._defaultTimezone });
    registerClassWithPrecision(m, "timestamptz", TimestampWithTimeZone);
  }
  return this._typeMap;
}
```

Those four lines are a verbatim copy of the private instance
`initializeTypeMap`'s body minus its closing `loadAdditionalTypes()`. Rails has
them in exactly one place.

Why it was shipped rather than converged in #7546: the getter is read
synchronously by callers, so it cannot await `loadAdditionalTypes`. Calling the
private `initializeTypeMap` from the getter and floating the promise was tried
and rejected — it double-loads (`configureConnection` already calls it) and
reorders `loadAdditionalTypes` calls, which reds
`postgresql-adapter.type-map.trails.test.ts`'s
`loads the type from pg_type on miss before falling back`. Deleting the lazy
init outright reds six unit tests that read `typeMap` on an unconnected
adapter, and risks silently breaking production paths that read it before
`configureConnection` — not verifiable on a host without a PG server.

## Converged shape

`typeMap` becomes the bare reader Rails has, with `_typeMap` populated by
`reloadTypeMap` / `configureConnection` before any read — deleting the lazy
branch and the duplicated registrations. The callers that today rely on the
getter populating on demand (including the six tests above) move to an
explicitly connected/reloaded adapter, matching Rails, where reading
`type_map` before `configure_connection` yields nil rather than a
lazily-built map.

Likely depends on
[[configure-connection-cannot-service-a-query-on-the-connection-it-configures]],
which covers the same connect/configure-ordering weakness from the SQLite side.

## Acceptance criteria

- [ ] `get typeMap()` contains no type registrations — the four
      `initialize_type_map` lines exist only in the private instance
      `initializeTypeMap`.
- [ ] `_typeMap` is populated by `reloadTypeMap` / `configureConnection`, as
      `postgresql_adapter.rb:359-367,991` does.
- [ ] The PostgreSQL lane stays green, including
      `postgresql-adapter.type-map.trails.test.ts` and
      `postgresql-adapter.exec-query.trails.test.ts`.
