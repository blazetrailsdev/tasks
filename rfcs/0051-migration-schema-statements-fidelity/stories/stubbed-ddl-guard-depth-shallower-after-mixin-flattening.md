---
title: "Re-derive the stubbed-DDL guard depth now that the DDL bodies are adapter methods"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5849
claim: "2026-08-02T01:06:49Z"
assignee: "stubbed-ddl-guard-depth-shallower-after-mixin-flattening"
blocked-by: null
closed-reason: null
---

## Context

PR #5841 deleted `AbstractAdapter#schemaStatements()`. Its recording guard,
`packages/activerecord/src/support/stubbed-ddl-methods.test.ts`, used to bind a
`SchemaStatements` module view to the proxy, so every `this.adapter.<member>`
call a module body made was recorded. With the bodies now on the adapter itself
that boundary no longer exists; the guard was re-pointed at a two-level proxy
(one hop of self-calls recorded, deeper ones not).

Consequence: members the lay path now reaches from deeper inside the adapter are
no longer pinned by the guard, and their `NON_EMITTING` entries were deleted as
stale per the test's own rule: `createTableDefinition`, `quoteIdentifier`,
`quoteTableName`, `quoteDefaultExpression`, `quotedColumnsForIndex`,
`nativeDatabaseTypes`, `indexNameLength`, `supportsForeignKeys`, `_config`.
None of these is in `STUBBED_DDL_METHODS`, so no cover behaviour changed — but
the trace the guard pins is now shallower than the one it pinned before.

Binding at full depth was measured and is not viable as-is: it records 46
unaccounted members (`_performQuery`, `materializeTransactions`, `verifiedBang`,
…), i.e. the whole adapter internals.

## Acceptance criteria

- Decide and implement the right depth for the guard now that the DDL bodies are
  adapter methods: either a full-depth recorder with an explicit, reasoned
  exemption list, or a documented boundary that pins the renderer-input members
  again.
- Whatever depth is chosen, `NON_EMITTING` is re-derived against it and the
  floor assertions stay honest.
- `packages/activerecord/src/support/stubbed-ddl-methods.test.ts` passes on the
  sqlite lane.
