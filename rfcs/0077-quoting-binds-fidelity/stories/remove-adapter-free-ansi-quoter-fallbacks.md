---
title: "Remove the adapter-free ANSI quoter fallbacks (Rails raises instead)"
status: draft
updated: 2026-08-02
rfc: "0077-quoting-binds-fidelity"
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

Rails has no adapter-free identifier quoter. Every host of the `Quoting`
module is a live adapter, and `abstract/quoting.rb:61` leaves
`quote_column_name` as `raise NotImplementedError` precisely so that quoting
without an adapter is impossible.

trails keeps a standalone SQL-92 quoter to fill that gap: the `@internal`
`quoteIdentifier` function at
`packages/activerecord/src/connection-adapters/abstract/quoting.ts:76`, bound
into two adapter-free hosts —

- `ABSTRACT_SCHEMA_QUOTER` (`abstract/quoting.ts:351`), used when a schema
  visitor or definition is built without a live adapter, and
- `ABSTRACT_QUOTER` in `sanitization.ts:34`, the no-connection fallback used
  by `quoterFor` when a model class has no resolvable adapter.

Both emit ANSI double-quoted SQL that no adapter asked for. On MySQL that is
simply wrong (backticks), so any DDL or sanitized fragment that reaches these
crutches is silently mis-quoted rather than failing loudly the way Rails
would.

PR #5893 removed the adapter _methods_ named `quoteIdentifier` and made the
abstract base raise as Rails does; the standalone function was explicitly
scoped out of that PR and is what remains.

Related: `adapterless-schema-quoters-force-lookup-cast-type-guards` (0023)
tracks the non-Rails guards these same two hosts force into
`quote_default_expression` / `lookup_cast_type_from_column`. Removing the
adapter-free hosts would resolve that story's root cause too — sequence the
two together.

## Acceptance criteria

- Every construction path that currently reaches `ABSTRACT_SCHEMA_QUOTER` or
  sanitization's `ABSTRACT_QUOTER` is audited and given a real adapter, or is
  shown to be unreachable and deleted.
- The standalone `quoteIdentifier` and both adapter-free quoter constants are
  removed once their last consumer is gone.
- Callers that genuinely have no connection surface a clear error rather than
  emitting ANSI SQL, matching Rails' `NotImplementedError` posture.
- `pnpm typecheck`, `pnpm lint` clean; quoting/sanitization/schema-creation
  suites pass on all three adapters.
