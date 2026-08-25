---
title: "arunit2-siblings-escape-run-token-ownership"
status: done
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5986
claim: "2026-08-03T16:23:44Z"
assignee: "arunit2-siblings-escape-run-token-ownership"
blocked-by: null
closed-reason: null
---

## Context

`7a9100e2` stamps a run token into every database a run creates, and
`ownRunDatabases` (`support/run-token.ts:104`) is the filter that decides
which databases teardown and the stale sweep may DROP. It matches on
`runTokenOfDatabase` (`run-token.ts:93`):

```ts
new RegExp(`^${escapeRegExp(base)}_(${TOKEN_PATTERN})_`).exec(name);
```

The arunit2 siblings do not survive that filter. `arunitDatabaseNames`
(`support/arunit2-config.ts:63`) inserts the `2` ahead of the slot suffix, so
a stamped sibling is:

```text
activerecord_unittest_<token>2_<slot>
```

Against `base = activerecord_unittest` the regex greedily reads the token as
`<token>2`, not `<token>`. Two consequences:

1. `ownRunDatabases(base, runToken, …)` never returns the siblings, so the
   PG and MySQL teardowns leak one arunit2 database per slot, per run.
   `template-global-setup.ts:226-228` explicitly claims the opposite —
   "the `_arunit2` siblings suites create off a slot name — shares the run's
   prefix, so one filtered sweep reclaims the lot."
2. Worse, `staleRunDatabases` (`run-token.ts:113`) sees `<token>2` as a
   _foreign_ token. If `runTokenStartedAt("<token>2")` parses and reads as
   older than `STALE_DB_AGE_MS`, a concurrent run can DROP a live run's
   arunit2 database — the exact cross-run collision the run token was
   introduced to eliminate, just displaced onto the sibling.

Found while fixing the CI red in #5649 (the assertion in
`connection.test.ts:48`); deliberately not widened into that PR, which is a
test-only change holding main green.

## Acceptance criteria

- A stamped arunit2 sibling is recognised as owned by its own run:
  `ownRunDatabases` returns it, teardown drops it.
- A stamped arunit2 sibling is never in `staleRunDatabases` for a concurrent
  run whose token differs.
- The naming rule stays collision-free across slots — the constraint
  documented at `arunit2-config.ts:44-51` (appending `2` after the slot would
  make slot 3 collide with slot 32) still holds.
- `runTokenOfDatabase`'s token capture is unambiguous: no database name a run
  mints may parse to a token other than the one that minted it. Worth a
  property-style test over (base, token, slot) triples.
- `arunit2-config.test.ts` gains the stamped-input case
  (`activerecord_unittest_<token>_<slot>`), which is currently untested — the
  existing cases all pass un-stamped names.

## Definition of done

- CI green; a PG or MySQL run leaves no `_2`-sibling databases behind after
  teardown.

## Verification

- `pnpm vitest run packages/activerecord/src/support/run-token.test.ts packages/activerecord/src/support/arunit2-config.test.ts`
