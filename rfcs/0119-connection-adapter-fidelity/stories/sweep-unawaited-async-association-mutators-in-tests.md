---
title: "Sweep statement-position unawaited async association mutators in the AR test suite"
status: done
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: 7670
claim: "2026-09-10T18:29:19Z"
assignee: "retire-stale-read-uncommitted-suppression"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7657. Collapsing the connection pool's pinning onto Rails'
single `@pinned_connection` slot
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:267-268,325-365`)
turned all four adapter lanes red, cascading through the has-one association
files with
`TransactionInstrumenter::InstrumentationAlreadyStartedError` raised from
`pinConnectionBang`.

The root cause was not the pool. Rails' `association(:x).writer(y)` is
synchronous (`activerecord/lib/active_record/associations/association.rb`), so
Rails' tests call it in statement position with no ceremony:

```ruby
new_member.association(:club).writer(new_club)
```

trails' writer is async. 23 ported call sites across four association test files
had been transcribed literally, without `await`, so each left a transaction open
past the test that opened it; the next `pin_connection!` then began a savepoint
on a stale parent. The old two-structure pinning happened to leave enough
microtask slack to hide it. #7657 added the missing `await`s.

That fixes the 23 that were failing, but the class is wider: any ported Rails
line that calls a trails method which became async is order-dependent in exactly
the same way, and silent until some unrelated timing change exposes it. The
failure mode is the worst kind — green locally, red on one lane, and the
stack points at the pool rather than at the test.

## Converged shape

Sweep the AR test suite for statement-position calls to association mutators
that return a promise and are not awaited — `writer`, and any sibling that RFC
0087's async conversion touched (`replace`, `concat`, `delete`, `destroy`,
`build`/`create` where the trails form is async).

A lint rule is the durable answer rather than a one-time grep:
`@typescript-eslint/no-floating-promises` already exists for this and is the
obvious candidate, scoped to `packages/activerecord/src/**/*.test.ts` if a
repo-wide enable is too large a step. Whichever shape lands, the point is that
the NEXT unawaited async port is caught at lint time rather than by a lane going
red three PRs later.

## Acceptance criteria

- [ ] Every statement-position call to an async association mutator in the AR
      test suite is awaited.
- [ ] A lint rule prevents a new one from landing, or the sweep is documented as
      one-time with the reason a rule cannot cover it.
- [ ] SQLite, MariaDB and PostgreSQL lanes green.
