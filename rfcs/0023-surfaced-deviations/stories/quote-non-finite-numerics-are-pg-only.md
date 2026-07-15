---
title: "Non-finite numeric quoting is PG-only in Rails — stop mirroring it in MySQL and the arel default quoters"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4876 (arel-unboundable-sign-duck-types-like-rails),
which had to assert `"users"."id" = 'Infinity'` in `to-sql.test.ts` — SQL Rails
never emits on that path — and documented it inline rather than converging.

**Non-finite numeric quoting is PostgreSQL-specific in Rails.** Only the PG
adapter overrides `quote` (`postgresql/quoting.rb:97-116`):

```ruby
when Numeric
  if value.finite?
    super
  else
    "'#{value}'"
  end
```

The abstract adapter emits it bare (`abstract/quoting.rb:82`):

```ruby
when Numeric then value.to_s
```

MySQL and SQLite do **not** override that branch, so Rails emits a bare
`Infinity` there. (It would be invalid SQL on MySQL — Rails simply does not
special-case it.)

Trails applies the PG rule everywhere:

1. `packages/arel/src/visitors/default-quoter.ts:48-52` — `quoteScalar`
   string-quotes every non-finite number, and it is the shared base for
   `defaultQuoter` AND `mysqlDefaultQuoter`; `postgresqlDefaultQuoter` spreads
   it and overrides only arrays, so PG is correct only by inheritance.
2. `packages/activerecord/src/connection-adapters/mysql/quoting.ts:183-187` —
   the production MySQL adapter, whose comment states the intent outright:
   "Non-finite numbers (±Infinity, NaN) have no MySQL literal ... Mirror PG's
   behavior and quote them as ...". Rails does not mirror PG here.
3. `packages/activerecord/src/connection-adapters/postgresql/quoting.ts:144` —
   correct; matches `postgresql/quoting.rb:111-115`. Leave alone.

The deviation is **ratified by tests**, which is the reason to converge rather
than wontfix:

- `packages/activerecord/src/connection-adapters/mysql/quoting.test.ts:41-44`
  — "quotes non-finite numbers as strings" asserts `'Infinity'` / `'-Infinity'`
  / `'NaN'` from the MySQL adapter.
- `packages/arel/src/visitors/to-sql.test.ts` — #4876's
  "a raw Float::INFINITY is bounded and renders as a value" and "Quoted wrapping
  INFINITY is bounded too" assert `= 'Infinity'`; Rails' adapter path gives
  `= Infinity`. #4876 documented this at the assertion instead of fixing it,
  deliberately: it is a quoting question, not an `unboundable?` one.
- `packages/arel/src/visitors/to-sql.test.ts:306-315` — `VALUES ('Infinity')`
  etc. on a connection-less visitor.

Note the pragmatic argument ("bare `Infinity` is invalid SQL on MySQL") is real
but is not Rails' behavior, and this repo's rule is to converge and register,
not to ratify a nicer-looking deviation. If the conclusion is genuinely
"trails is right and Rails is wrong", that needs to be an explicit,
anchored decision on this story — not an inline comment.

Related: `eliminate-arel-default-quoters-supply-connection`
(RFC 0007, draft) deletes `default-quoter.ts` wholesale, which subsumes site 1.
Sites 2 and 3 are production adapters and are outside that story's scope, so
this story stands on its own. Sequence behind it if it lands first.

## Acceptance criteria

- [ ] The non-finite `"'#{value}'"` branch lives ONLY in the PG adapter's
      `quote`, mirroring `postgresql/quoting.rb:111-115`; MySQL
      (`mysql/quoting.ts:183-187`) drops it and falls through to the abstract
      `when Numeric then value.to_s` (`abstract/quoting.rb:82`).
- [ ] Confirm SQLite has no such branch either (Rails' sqlite3 adapter does not
      override the Numeric arm).
- [ ] `default-quoter.ts`'s `quoteScalar` either stops string-quoting non-finite
      for the base/MySQL hosts (keeping it on `postgresqlDefaultQuoter` only), or
      the site is closed out by
      `eliminate-arel-default-quoters-supply-connection` — record which.
- [ ] The ratifying tests above are re-pointed at Rails' output, not renamed
      away. `mysql/quoting.test.ts`'s "quotes non-finite numbers as strings" is a
      trails invention asserting the deviation — reconcile it against what Rails'
      MySQL adapter actually emits.
- [ ] PG behavior unchanged: `quote(Float::INFINITY)` still `'Infinity'`;
      `postgresql/numbers.test.ts` stays green.
- [ ] api:compare / test:compare delta non-negative.
