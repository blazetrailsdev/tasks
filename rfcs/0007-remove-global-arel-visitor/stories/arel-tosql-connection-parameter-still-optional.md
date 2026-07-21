---
title: "Arel toSql connection parameter is still optional; the connection-less fallback survives"
status: draft
updated: 2026-07-21
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5037 (arel-tests-lack-fakerecord-quoting-double), merged.

PR #5037 threaded an explicit connection through the Arel `toSql` surface, mirroring
Rails' engine-defaulted signatures:

- `Node#toSql(connection?)` — `arel/nodes/node.rb:148-153` (`to_sql(engine = Table.engine)`)
- `TreeManager#toSql(connection?)` — `arel/tree_manager.rb:53-58`
- `SelectManager#whereSql(connection?)` — `arel/select_manager.rb:192-196`

In Rails the default is `Table.engine`, a real engine that always yields a real
connection. trails has no `Table.engine` (arel must not depend on activerecord),
so the parameter is OPTIONAL and omitting it falls back to the connection-less
`defaultQuoter`. That fallback is the invention RFC 0007 set out to delete.

`eliminate-arel-default-quoters-supply-connection` (0007) is already `done`, so
nothing currently owns removing this last default — #5037 added the parameter but
could not require it without touching every caller, which would have blown the
PR's scope.

Making the parameter REQUIRED is what actually retires the connection-less path:
today any caller that omits it silently gets adapter-inaccurate SQL
(`FALSE` where a real adapter or the FakeRecord double would differ), which is
precisely the class of bug #5037 existed to make visible.

Note `packages/arel/src/test-helpers/connection.ts` says these bindings
"collapse into this file" once every call site names its connection — that
collapse is this story.

## Acceptance criteria

- [ ] Every in-repo caller of `Node#toSql` / `TreeManager#toSql` /
      `SelectManager#whereSql` passes an explicit connection.
- [ ] The parameter becomes required; the `defaultQuoter` fallback in
      `visitors/to-sql.ts` (`constructor(connection: ArelConnection = defaultQuoter)`)
      is removed.
- [ ] `defaultQuoter` / `mysqlDefaultQuoter` / `postgresqlDefaultQuoter` are
      deleted or reduced to the test-helper bindings that remain necessary.
- [ ] `testConnection` in `test-helpers/connection.ts` is re-evaluated per the
      "collapse into this file" note.
- [ ] arel test suite passes; test:compare delta for arel non-negative.
