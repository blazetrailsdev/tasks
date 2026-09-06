---
title: "rawExecQuery/internalExecQuery guard on host capabilities Rails does not check"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rawExecQuery` and `internalExecQuery`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`)
each open with a guard Rails has no counterpart for:

```ts
if (!this.rawExecute) throw new Error("rawExecQuery requires rawExecute on the adapter");
...
if (binds && binds.length > 0)
  throw new Error("internalExecQuery requires internalExecute on the adapter when binds are provided");
```

Rails is `cast_result(raw_execute(...))` / `cast_result(internal_execute(...))`
and nothing else
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:540-547`):
`raw_execute` and `internal_execute` are defined on the same module, so there is
nothing to check — an adapter that fails to define `perform_query` gets
`NotImplementedError` from the stub at `:561`, which is the Rails failure mode.

The guards exist because the TS host is a structural interface with optional
members, and they are also why the `execute`-fallback arm below them exists at
all. Both are invented error classes and messages, and the bind guard encodes a
capability split Rails does not have.

## Acceptance criteria

- [ ] Both bodies are the bare `castResult(...)` delegation, with no capability
      guards and no invented `Error` messages.
- [ ] `rawExecute` / `internalExecute` are required (non-optional) on
      `DatabaseStatementsHost`, so the absence is a type error rather than a
      runtime string — or, if a host genuinely cannot supply them, the failure
      is Rails' `NotImplementedError` from the `perform_query` stub.
- [ ] The no-binds `execute` fallback arm goes with them unless a caller is
      shown to depend on it; if one does, cite it.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
