---
title: "Retire the seven quoting dispatch* helpers onto Rails' plain self-send"
status: done
updated: 2026-08-10
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps:
  [
    "adapter-override-fields-should-be-prototype-methods",
    "remove-adapter-free-ansi-quoter-fallbacks",
  ]
deps-rfc: []
est-loc: 180
priority: null
pr: 6301
claim: "2026-08-09T20:49:23Z"
assignee: "retire-quoting-dispatch-helpers-onto-self-send"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Quoting` module self-sends: `quote` calls `quoted_true`, `quoted_binary`,
`quoted_date`, `quoted_time` on `self`, and `quote_table_name` is
`self.class.quote_column_name(table_name)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:73-91`,
`:141-143`). There is no conditional — the receiver either defines the method or
inherits it, and a receiver that defines neither is a bug that raises.

trails cannot self-send through a module function, so it grew a parallel
**dispatch layer** in `packages/activerecord/src/connection-adapters/abstract/quoting.ts`
— seven `@internal` helpers, each of which probes the host and silently falls
back to the module-level default:

- `dispatchQuotedBinary` (`:509`), `dispatchQuotedDate` (`:522`),
  `dispatchQuote` (`:535`), `dispatchQuotedTrue` (`:554`),
  `dispatchQuotedFalse` (`:559`), `dispatchUnquotedTrue` (`:564`),
  `dispatchUnquotedFalse` (`:569`), `dispatchQuotedTime` (`:574`).

Every one is shaped `typeof host.x === "function" ? host.x(...) : x(...)`. The
same probe appears inline in `quoteTableName` (`:107-113`), which falls back to
the module-level `quoteColumnName` — the function whose entire body is
`throw new NotImplementedError()` (`:95-98`) — so a partial host gets a raise
from the wrong frame instead of its adapter's quoter.

38 call sites across `abstract/quoting.ts`, `mysql/quoting.ts` (`:286`, `:297`,
`:304`), `sqlite3/quoting.ts` (`:109`, `:213`, `:246`, `:253`) and the PG
quoting file consume them.

**Why it is wrong, not just verbose.** The fallback arm is reachable exactly when
an override is on the _instance_ rather than the prototype, or when the receiver
is a bare `Object.create(Adapter.prototype)` test host. In that case the caller
gets the ANSI/abstract answer — `'t'`/`'f'` where MySQL wants `1`/`0`, ANSI
double quotes where MySQL wants backticks — with **no error**. That is the exact
silent-degradation failure mode already documented in
[[adapter-override-fields-should-be-prototype-methods]]; the dispatch helpers are
what convert it from a crash into a plausible wrong answer.

## Converged shape

Once every adapter override is a prototype method (that story) and the
adapter-free hosts are gone ([[remove-adapter-free-ansi-quoter-fallbacks]]), the
probe has no reachable false arm. Each `dispatchX(this, v)` becomes the plain
self-send Rails writes — `this.x(v)` — and the seven helpers plus the
`QuotingDispatchHost` optional-member typing are deleted. `quoteTableName`
becomes an unconditional `this.quoteColumnName(name)`, matching `quoting.rb:141`,
so a host without a quoter raises `NotImplementedError` from `quote_column_name`
as Rails does.

## Dependencies

Sequence **after** `adapter-override-fields-should-be-prototype-methods` and
`remove-adapter-free-ansi-quoter-fallbacks` — both remove reachable callers of
the fallback arm. Landing this first would turn their silent-degradation cases
into crashes in the middle of an unrelated PR.

## Acceptance criteria

- [ ] The seven `dispatch*` helpers are deleted from
      `connection-adapters/abstract/quoting.ts`; all 38 call sites read as the
      direct self-send Rails writes.
- [ ] `quoteTableName` (`:107`) calls `this.quoteColumnName(name)`
      unconditionally, per `quoting.rb:141-143`.
- [ ] `QuotingDispatchHost`'s members are no longer optional (or the interface is
      gone), so a host missing a quoter is a compile error rather than a silent
      ANSI fallback.
- [ ] A test pins that an adapter-shaped receiver whose override is absent
      **raises** rather than returning the abstract answer.
- [ ] `pnpm parity:api:extra --package activerecord` shows the eight names gone and no
      new surface; `pnpm parity:api:calls` green.
- [ ] Quoting/sanitization/schema-creation suites green on sqlite3, postgresql,
      mysql2.
