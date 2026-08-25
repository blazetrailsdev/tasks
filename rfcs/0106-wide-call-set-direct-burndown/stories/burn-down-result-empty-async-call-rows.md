---
title: "Burn down the 41 empty/empty? call-set rows surfaced by Result.empty(async:)"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 2
pr: 6559
claim: "2026-08-15T01:45:06Z"
assignee: "burn-down-result-empty-async-call-rows"
blocked-by: null
closed-reason: null
---

> Re-filed from RFC 0084 on 2026-08-14 when 0084 was superseded by RFC 0106
> (direct burndown). Body preserved verbatim below; the original is closed as superseded.

## Context

PR #6515 gave `ActiveRecord::Result.empty` Rails' `async:` kwarg
(`vendor/rails/activerecord/lib/active_record/result.rb:94-100`). That one
signature change surfaced **41 pre-existing call-set divergences** that the
ratchet had been silently suppressing. No TS body changed; only the gate's view
of them did.

The mechanism is `significantMissingCalls`' gate 2 in
`scripts/api-compare/compare.ts`: a Rails call is only flagged when its mapped TS
candidate `isPortedWithArgs` — a method that takes arguments _somewhere_. Before
PR #6515, `Result.empty` took none, so every Rails `empty` / `empty?` call whose TS
spelling resolved to it was skipped as noise. Adding the kwarg flipped
`isPortedWithArgs("empty")` true and all 41 became visible at once.

They were baselined (not converged) in #6515 because they are not that story's
work — each carries a reason beginning "Pre-existing divergence, newly SURFACED
(not introduced) by story call-args-ar-select-all-empty-async-row". This story is
the burndown.

Rows by file (`scripts/api-compare/call-mismatches-exclude/activerecord/**`; grep
the reason string above to list them exactly):

```text
 8  relation.ts                     6  relation/query-methods.ts
 4  relation/merger.ts              3  relation/calculations.ts
 2  insert-all.ts                   2  relation/finder-methods.ts
 1  each of: associations/association-scope.ts, associations/collection-association.ts,
    associations/has-many-association.ts, associations/join-dependency.ts, base.ts,
    connection-adapters/abstract-mysql-adapter.ts,
    connection-adapters/abstract/schema-statements.ts,
    connection-adapters/abstract/transaction.ts,
    connection-adapters/sqlite3/database-statements.ts,
    encryption/extended-deterministic-queries.ts, relation/batches.ts,
    relation/predicate-builder/association-query-value.ts,
    relation/predicate-builder/polymorphic-array-value.ts,
    relation/predicate-builder/relation-handler.ts, tasks/database-tasks.ts,
    transactions.ts
```

Most are Rails `empty?` where the TS body tests emptiness some other way
(`.length === 0`, a truthiness check, an inverted guard) instead of calling the
ported `isEmpty()`; a handful are `Result.empty` itself (e.g. `relation.rb`'s
`ids`/`pluck` contradiction arm, `calculations.rb:238`). Each needs reading
against its Ruby counterpart — some will be genuine dropped calls, some will be
`aliasCall`-shaped JS idioms that should be credited rather than converged.

## Converged shape

Each TS body calls what its Ruby counterpart calls — `isEmpty()` where Rails
calls `empty?`, `Result.empty` where Rails calls `Result.empty` — and its baseline
row is deleted (only-shrink, never `--write`), with the unreviewed mark shard
tightened per file.

## Acceptance criteria

1. Every row whose reason contains "newly SURFACED (not introduced) by story
   call-args-ar-select-all-empty-async-row" is either converged and deleted, or
   re-reasoned with a per-entry verified justification specific to that call site
   (the blanket surfacing reason is not a permanent justification).
2. `pnpm parity:api:calls` stays green throughout; marks tightened, never reseeded.
3. No behavior change — these are call-shape convergences, so the AR suite is green
   without test edits, and any test that DOES need editing is a signal the call was
   not equivalent and deserves its own note.

## Splitting

Too large for one PR at the repo's LOC ceiling — split by file cluster
(`relation.ts` + `relation/query-methods.ts` is the biggest single lump at 14
rows). Each split PR branches from `main` with non-overlapping files.
