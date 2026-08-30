---
title: "internalExecQuery's capability probe, invented error and no-binds execute arm have no Rails counterpart"
status: draft
updated: 2026-08-30
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7225 (RFC 0128 `execute` param-drift convergence), which
converged `execute` onto Rails' `(sql, name = nil, allow_retry: false)` and made
it delegate to `internalExecute`.

Rails' `exec_query` is one line:

```ruby
def exec_query(sql, name = "SQL", binds = [], prepare: false)
  internal_exec_query(sql, name, binds, prepare: prepare)
end
```

(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:147-149`),
and `internal_exec_query` is `cast_result(internal_execute(...))` (`:546-548`).
There is no branch, no capability probe, and no `execute` path.

trails' `internalExecQuery`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:790-815`)
carries an invented three-armed body instead:

```ts
if (this?.internalExecute) { ...castResult... }
if (binds && binds.length > 0) {
  throw new Error(
    "internalExecQuery requires internalExecute on the adapter when binds are provided",
  );
}
const result = await (this.execute ?? execute).call(this, sql, name);
return normalizeResult(result);
```

Three deviations in one body: a runtime probe for `internalExecute`, an error
class and message with no Rails counterpart, and a no-binds fallback that
reaches `execute` — a call Rails' `exec_query` never makes.

This branch is also what blocks converging the remaining `(this.execute ?? execute)`
fallback (see the sibling story): narrowing `internalExecQuery`'s `this` to
require `execute` propagates the invented branch's typing outward into `query`
and `rawExecQuery` rather than removing it. It converges by deletion, not by
retyping.

`normalizeResult` (`:818-845`) exists only to serve this fallback's untyped
return and should go with it; Rails uses `cast_result`, which trails already
dispatches at the first arm.

## Acceptance criteria

- `internalExecQuery` is `castResult(internalExecute(...))` with no capability
  probe, no invented error, and no `execute` arm, mirroring
  `database_statements.rb:546-548`.
- The invented `"internalExecQuery requires internalExecute..."` error is gone.
- `normalizeResult` is removed if nothing else needs it, or reduced to the
  `castResult` dispatch Rails has.
- Hosts that reached the fallback either override `internalExecute` or are
  fixed; no adapter regresses.
- `parity:api:calls` / `parity:api:calls:args` gain no row; `parity:api:extra`
  loses the `normalizeResult` name if it is removed.
