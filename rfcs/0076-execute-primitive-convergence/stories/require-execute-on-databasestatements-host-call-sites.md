---
title: "Drop the remaining (this.execute ?? execute) host-dispatch fallbacks"
status: draft
updated: 2026-08-30
rfc: "0076-execute-primitive-convergence"
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

Surfaced in PR #7225 (RFC 0128 `execute` param-drift convergence). This is the
`execute` twin of `require-typecastedbinds-on-databasestatements-host`, and the
same root cause.

`execute` is declared **optional** on `DatabaseStatementsHost`
(`connection-adapters/abstract/database-statements.ts:76`), so every mixin
function that calls it through a host-typed `this` needs a fallback that Rails
has no counterpart for. Ruby writes a plain self-call — `execute(sql, name)` in
`truncate` (`abstract/database_statements.rb:280`) — and method lookup finds the
adapter's override. The optionality is an artifact of typing `self` for the
extracted mixin, not a real capability question: `include(AbstractAdapter,
DatabaseStatements)` (`abstract-adapter.ts:2117`) puts `execute` on the
prototype, so every real adapter has it.

PR #7225 converged two of the sites — `truncate` and `insertFixture` now read
`this.execute(sql, name)` — using a technique worth reusing here: rather than
making the interface member required (which forces a stub `execute` into ~20
unrelated test doubles in `database-statements.trails.test.ts`, the exact churn
that stalled the `typeCastedBinds` twin), declare the requirement on the `this`
type of the functions that actually call it:

```ts
this: DatabaseStatementsHost &
  Required<Pick<DatabaseStatementsHost, "execute">> &
  Pick<Quoting, "quoteTableName">,
```

That is the same `DatabaseStatementsHost & Pick<...>` idiom the file already
uses to say which host capabilities a mixin function needs, and it cost zero
test-double stubs.

Remaining `execute` fallback sites:

- `truncateTables` — `connection-adapters/abstract/database-statements.ts:373`
  (`const exec = this.execute ?? execute`)
- `insertFixturesSet` — same file `:678`
- `internalExecQuery` — same file `:814`

The third is **blocked on deleting the invented no-binds branch** (see
`internal-exec-query-invented-fallback-branch`): narrowing that function's
`this` propagates the branch's typing into `query` and `rawExecQuery` instead of
removing it. Do the first two here; the third falls out for free once that
branch is gone.

The same shape exists for other host members in this file
(`internalExecute` at `:322`, `internalExecQuery` at `:311` and `:1383`,
`buildTruncateStatement` at `:349` and `:1341`, `buildTruncateStatements` at
`:367`) and is in scope if the per-function technique holds.

## Acceptance criteria

- `truncateTables` and `insertFixturesSet` call `this.execute(...)` with no
  `?? execute` arm, declaring the requirement on their `this` type.
- No test double gains a stub member it does not exercise.
- The remaining `(this.X ?? X)` host-dispatch arms in the file are either
  converged the same way or left with the blocking reason named.
- `parity:api:calls` / `parity:api:calls:args` gain no row.
