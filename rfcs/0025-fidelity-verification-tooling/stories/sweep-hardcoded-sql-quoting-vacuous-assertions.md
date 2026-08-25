---
title: "Sweep test SQL assertions that hardcode double-quoted identifiers and pass vacuously on MySQL"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Already satisfied, verified 2026-08-17: zero hardcoded double-quoted SQL identifiers remain in packages/activerecord/src/**/*.test.ts (grep for FROM "/JOIN "/SELECT-with-escaped-quote returns 0 matches), against 288 uses of quoteTableName/quoteColumnName/quote-regex in those files. The sweep landed organically across the adapter-parity work. No reintroduction guard exists — if one is wanted, that is a separate lint story, not this sweep.'
---

## Context

Surfaced by a MariaDB CI failure on #5909.

`relation/build-joins-from-subquery-dedup.test.ts` compared join sequences by
slicing SQL from a hardcoded `FROM "posts"` marker. MySQL/MariaDB quote with
backticks, so `indexOf` returned `-1`, `slice(-1)` yielded the SQL's last
character, and `expect(subSql).toContain("s")` passed VACUOUSLY on those lanes —
two assertions had been no-ops there since the file was written. The defect only
surfaced because a newly added assertion (`toContain("CROSS JOIN categories")`)
failed outright instead of degenerating to true.

PR #5909 fixed that file by routing the marker through `quoteTableName`
(`packages/activerecord/src/support/quote-regex.ts`), the sanctioned
adapter-agnostic helper, and asserting the marker was found. The same failure
mode — a hardcoded `"`-quoted identifier inside `indexOf`/`slice`/`toContain`
rather than a `quoteTableName` regex — is likely present elsewhere in the AR
suite, where it silently weakens MySQL-lane coverage instead of failing.

This is the same class as
[[project_ported_tests_drop_assert_queries_count_become_noops]]: assertions that
still run but no longer assert.

## Acceptance criteria

- Sweep `packages/activerecord/src/**/*.test.ts` for SQL assertions embedding a
  hardcoded double-quoted identifier (`FROM "`, `JOIN "`, `INTO "`, `"posts"."`,
  …) used with `indexOf`/`slice`/`toContain`/`toBe` rather than a
  `quoteTableName`/`quoteColumnName` regex.
- Route each through `support/quote-regex.ts`, or gate the test on adapter where
  the quoting genuinely is the subject.
- Prefer assertions that fail loudly on a missed marker (assert the index is
  found) over containment checks that degrade to true.
- Report how many assertions were vacuous on the MySQL lanes before the fix.
