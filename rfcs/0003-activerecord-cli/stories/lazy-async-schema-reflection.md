---
title: "Lazy async schema reflection (delete explicit loadSchema)"
status: ready
rfc: "0003-activerecord-cli"
cluster: core
deps: []
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A bare-AR user must call `loadSchema()` after migrating for schema-driven
(zero-attribute) models, because there is no lazy reflection on the
in-memory/pool-1 path. Queries are already `async`, so the query/persistence path
can `await` a one-shot `ensureSchemaLoaded()` when a model's schema hasn't been
reflected. The async reflection path (`loadSchemaFromAdapter`) already works
(verified); only the sync path deadlocks on in-memory/pool-1.

This deletes the explicit `loadSchema` step from every consumer, leaving
bootstrap = `establishConnection()` + the generated manifest import.

See RFC 0003 §Core changes (§6.1).

## Acceptance criteria

- [ ] Query/persistence path `await`s a one-shot `ensureSchemaLoaded()` when the
      model's schema is unreflected, via the async path
- [ ] Explicit `loadSchema()` calls become unnecessary in normal consumers
- [ ] In-memory/pool-1 path does not deadlock (uses async reflection, not sync)

## Notes

Orthogonal to the CLI packaging — a core roadmap change. Residual accepted edge:
attribute access on a record that was never queried and never loaded (e.g.
`new User().handle` before any DB hit) cannot trigger async reflection from a
getter without a per-instance `Proxy`; Rails solves this with synchronous
`method_missing`. Source: #2638.
