---
title: "Make typeCastedBinds required on DatabaseStatementsHost and drop the payload fallbacks"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4998 (`type-casted-binds-payload-self-dispatch`) and raised in its
review.

`typeCastedBinds` is declared **optional** on `DatabaseStatementsHost`
(`connection-adapters/abstract/database-statements.ts:106`), so every payload
producer that reaches it through a host-typed `this` needs a fallback:

- `database-statements.ts:1358` (`logSql`) and `:1845` (`rawExecute`)
- `query-cache.ts:645` (`cacheNotificationInfo`)

PR #4998 changed those fallbacks from `?? binds` to `?? []` after review, because
falling back to the raw uncast binds silently reinstated exactly the strategy-B
divergence the PR removed. `?? []` at least fails loudly. But the fallback
should not exist at all: `include(AbstractAdapter, QuotingMixin)`
(`abstract-adapter.ts:2543`) puts the method on the prototype, so every real
adapter has it — the optionality exists only because ~20 bare object literals in
`database-statements.test.ts` are typed as `DatabaseStatementsHost` and would
fail to typecheck if the member were required.

Making it required was attempted during #4998 and backed out: the churn across
unrelated test stubs was judged a poor trade mid-PR. It is the right end state,
just as its own change.

Note `rawExecute` is the one site where the fallback is not merely cosmetic —
its `tcBinds` feeds `performQuery` as actual driver binds, so `?? []` there
would send an empty bind list rather than raise.

## Acceptance criteria

- [ ] `typeCastedBinds` is a required member of `DatabaseStatementsHost` (and
      `QueryCacheHost`), matching the fact that it is always mixed in.
- [ ] All `?? []` fallbacks at the three call sites above are removed — the
      call is unconditional, as it already is at the adapter class sites.
- [ ] Test stubs typed as `DatabaseStatementsHost` are updated; prefer a shared
      helper over pasting a stub member into ~20 literals.
- [ ] No behavior change: `type-casted-binds-payload.trails.test.ts` and
      `query-cache.trails.test.ts` still pass on SQLite, PG and MySQL.
