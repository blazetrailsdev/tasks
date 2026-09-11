---
title: "Express the four adapter-concurrency tests at the pool level, where Rails' guarantee lives"
status: done
updated: 2026-09-11
rfc: "0146-exclusive-connection-leasing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: trails#7672
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0146 Phase 2 was re-scoped by its own measurement. The four tests that
Phase 1 used as the signal for exclusive leasing do not exercise the pool at
all:

- `abstract-adapter.lifecycle.trails.test.ts:54` — "withRawConnection serializes
  concurrent calls and yields the connection"
- `abstract-adapter.lifecycle.trails.test.ts:109` — "reconnectBang serializes
  concurrent callers"
- `abstract-adapter.lifecycle.trails.test.ts:134` — "verifyBang serializes
  concurrent callers and promotes the unconfigured connection once"
- `postgresql-adapter.exec-query.trails.test.ts:335` — "reads currval on the
  session that ran its own INSERT"

Each constructs a bare adapter (`new AbstractAdapter({})`, `makeAdapter`) and
calls it concurrently with no `ConnectionPool` in the picture, so
`connectionLease()` and `executionContextId()` are never reached. With
`lock = NullLock` they fail 4/30 regardless of lease identity — and **Rails
behaves the same way**: it does not serialize two threads on one adapter under
`NullLock` (`abstract_adapter.rb:181-192`), it relies on the connection never
being shared in the first place.

So these tests currently assert a trails-specific guarantee (the monitor) rather
than a Rails one, and they are the reason the `NullLock` default looks
unreachable. Until they are expressed at the level where Rails' guarantee
actually lives — the pool — no measurement through them can tell us whether
exclusive leasing works.

## Acceptance criteria

- [ ] The three `abstract-adapter.lifecycle.trails.test.ts` cases are rewritten
      to obtain their adapter by checking out of a real `ConnectionPool`, so
      concurrency between callers is concurrency between pool consumers.
- [ ] `postgresql-adapter.exec-query.trails.test.ts:335` likewise obtains its
      connection from a pool, so the `currval` sequence models Rails'
      one-connection-per-thread guarantee
      (`postgresql/database_statements.rb:45-61`) instead of a shared bare
      adapter.
- [ ] Any case whose only subject is "two callers share one bare adapter" is
      retired rather than rewritten — with a one-line note saying Rails does not
      make that guarantee either.
- [ ] All four pass on `ARCONN=postgresql` and `ARCONN=sqlite3_mem` with the
      monitor still installed (this story changes tests, not the lock default).
- [ ] `abstract-adapter-lock-defaults-to-monitor-not-nulllock` has its
      `blocked-by` rewritten against the new tests, or is unblocked if they pass
      with `NullLock`.

## Definition of done

Keeping a bare-adapter concurrency assertion and adding a pool-level one beside
it does not close this story. The bare-adapter guarantee is the deviation being
retired — leaving it in place means the `NullLock` default still cannot land.

Changing the lock default is out of scope here; that is
`abstract-adapter-lock-defaults-to-monitor-not-nulllock`, which this unblocks.

## Verification

`ARCONN=postgresql pnpm vitest run packages/activerecord/src/connection-adapters/abstract-adapter.lifecycle.trails.test.ts packages/activerecord/src/connection-adapters/postgresql-adapter.exec-query.trails.test.ts`,
and the same with `ARCONN=sqlite3_mem`.

## Notes

`lease-identity-must-not-collapse-to-context-zero` is blocked on this: its own
question — whether lease identity may key on `executionContextId()`, whose
unscoped fallback is `0` — is only answerable once the tests run through the
pool. Its second finding stands and belongs to that story, not this one: sticky
`leaseConnection()` has no block to scope, so concurrent sibling awaits in one
async context cannot be told apart without caller opt-in, which means the
lease-identity question should be settled for block-form `withConnection` first.
