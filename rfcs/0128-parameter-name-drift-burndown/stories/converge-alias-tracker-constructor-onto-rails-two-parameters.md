---
title: "AliasTracker#initialize takes two extra parameters standing in for Hash#default_proc"
status: done
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 3
pr: 7212
claim: "2026-08-29T16:33:48Z"
assignee: "param-drift-associations-constructors-take-an-extra-parameter"
blocked-by: null
closed-reason: null
---

## Context

Rails' tracker takes exactly two parameters:

```ruby
# vendor/rails/activerecord/lib/active_record/associations/alias_tracker.rb:53
def initialize(table_alias_length, aliases)
  @aliases = aliases
  @table_alias_length = table_alias_length
end
```

`packages/activerecord/src/associations/alias-tracker.ts` takes four —
`(tableAliasLength, aliases, joins, connection)` — and carries `_joins` /
`_connection` fields Rails has no counterpart for.

The cause is `Hash#default_proc`. Rails does not store the joins: `create` builds
an `aliases` Hash whose default_proc closes over `connection` and `joins` and
calls `initial_count_for(connection, k, joins)` on first miss
(`alias_tracker.rb:14-22`), then hands that Hash to `new`. A JS `Map` has no
default_proc, so the port pushed the two closed-over values into the constructor
and re-implements the miss path in a private `_getCount` (`alias-tracker.ts:100-108`)
that `aliased_table_for` / `alias_for` call where Rails just reads `aliases[name]`
(`:60`, `:68`, `:88`).

PR #7171 converged `create` to Rails' four parameters and threaded the connection
in; the constructor's two extra slots are what is left.

## Converged shape

Two parameters, `(tableAliasLength, aliases)`, with the default-proc behaviour
carried by the `aliases` value the caller passes rather than by tracker state —
e.g. a Map subclass whose `get` miss runs the closure `create` built, so
`aliasedTableFor` reads `this.aliases.get(name)` directly and `_getCount`
disappears. That also removes a private helper Rails does not have.

## Acceptance criteria

- `AliasTracker`'s constructor takes Rails' two parameters; `_joins` /
  `_connection` / `_getCount` are gone.
- `create` (`alias_tracker.rb:9-25`) still supplies the miss behaviour, and
  `initial_count_for` still receives the connection.
- Both construction paths updated: `create`, and `JoinDependency`'s two direct
  `new AliasTracker(...)` calls (`associations/join-dependency.ts:128`, `:259`).
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` and `parity:api:extra` show no new row; AR suite green on
  all three lanes.
