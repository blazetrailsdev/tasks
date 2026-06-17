---
title: "Preserve QueryAttribute bind objects on the sql.active_record payload (binds are logged)"
status: claimed
updated: 2026-06-17
rfc: "0016-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 120
priority: 50
pr: null
claim: "2026-06-17T12:31:26Z"
assignee: "preserve-queryattribute-binds-in-notification-payload"
blocked-by: null
---

## Context

`it.skip("binds are logged")` in `packages/activerecord/src/bind-parameter.test.ts`
mirrors Rails `bind_parameter_test.rb:137-145`:

```ruby
sub   = Arel::Nodes::BindParam.new(1)
binds = [Relation::QueryAttribute.new("id", 1, Type::Value.new)]
sql   = "select * from topics where id = #{sub.to_sql}"
@connection.exec_query(sql, "SQL", binds)
message = @subscriber.calls.find { |args| args[4][:sql] == sql }
assert_equal binds, message[4][:binds]
```

It asserts the `sql.active_record` notification payload preserves the **same
`QueryAttribute` objects** that were passed to `exec_query` — a distinct payload
slot (`payload[:binds]` = Attribute objects) from `payload[:type_casted_binds]`
(primitives).

trails can't reproduce this today for two linked reasons:

1. **Binds are type-cast to primitives upstream of the adapter** (in the
   relation / predicate-builder layer), so by the time a query reaches the
   notification boundary `payload.binds` only ever carries primitives — there is
   no Attribute-objects-vs-primitives split to assert. See the sibling passing
   test `find one uses binds`, whose `payload.binds` is `[1]`, and its inline
   comment.
2. **A hand-built `exec_query` with raw `QueryAttribute` binds can't force it
   either:** the sqlite driver type-casts inside `execute`
   (`connection-adapters/sqlite3-adapter.ts` — `binds.map(_driverBind)` before
   `Notifications.instrumentAsync`, ~ll. 332-335) _before_ instrumentation is
   entered, so a raw QueryAttribute is rejected and no event fires.

Preserving Attribute objects on the notification payload (while still
type-casting for the driver via a separate `type_casted_binds` slot) is
production work in the exec/instrumentation path. It is adjacent to but separate
from the connection statement-pool population tracked in
`revisit-statement-cache-find-skips-after-cache-routing` (this RFC).

Rails refs: `bind_parameter_test.rb:137-145`; `ActiveRecord::Relation::QueryAttribute`.

## Acceptance criteria

- The `sql.active_record` payload exposes `binds` as the Attribute objects passed
  to `exec_query` and `type_casted_binds` as the driver primitives — matching
  Rails' two-slot payload — without breaking the `find one uses binds`,
  `logs binds after type cast`, `logs unnamed binds`, or `binds with filtered
attributes` tests (which read the rendered/cast form).
- Un-skip `binds are logged` in `bind-parameter.test.ts` and make it pass against
  canonical SQLite (gated on `prepared_statements` per the Rails class wrapper).
- Test name unchanged (test:compare matching). No stubs. No forcing green — if the
  upstream type-cast can't be deferred without broad fallout, keep it skipped and
  re-point with a sharpened rationale rather than contorting the assertion.
