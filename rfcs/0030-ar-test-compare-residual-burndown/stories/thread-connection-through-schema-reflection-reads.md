---
title: "Thread connection through schema-reflection reads; drop the .connection getter bridge"
status: claimed
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 3
pr: null
claim: "2026-07-05T22:41:54Z"
assignee: "thread-connection-through-schema-reflection-reads"
blocked-by: null
---

## Context

Follow-up to `thread-yielded-connection-internal-query-path` (PR #3876). That PR
threaded the `withQueryConnection`-yielded connection through the relation /
calculations / persistence / transactions hot paths and the `base.ts`
INSERT/UPDATE/DELETE record paths, so they no longer read the deprecated
`Model.connection` getter. But the **schema-reflection** reads that run on the
wrapped path still go through the getter:

- `model-schema.ts` `columnsHash` / `columns` / related (e.g. ~lines 101, 245,
  402, 406, 490, 906, 921, 1140, 1193, 1208) read `this.connection`.
- `timestamp.ts` `timestampAttributesForCreateInModel` → `columnNames` →
  `columnsHash` reaches the getter during create.

PR #3876 mitigated this with a bridge: the `.connection` getter now resolves to
the threaded connection **for its own pool** (`threadedConnectionFor` pool-
identity guard) without flipping the lease permanent. That is faithful in
observable behavior but is a trails-specific mechanism — Rails threads the
connection through schema reflection (or reads it via `connection_pool` /
`schema_cache`) rather than re-resolving the deprecated getter.

## Acceptance criteria

- [ ] Schema-reflection reads on the wrapped query/transaction path
      (`model-schema.ts` `columnsHash`/`columns`/`quoteTableName` etc.,
      `timestamp.ts`) thread the connection (or read `connection_pool` /
      `schema_cache`) instead of the deprecated `Model.connection` getter.
- [ ] The getter→threaded-connection bridge in `connection-handling.ts`
      `connection()` (the `threadedConnectionFor(this)` early return) can be
      removed, with `ConnectionHandlingTest` "common APIs don't permanently
      hold a connection…" still passing.
- [ ] No api:compare / test:compare regression.
