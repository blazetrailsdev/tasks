---
title: "date-assertion-value-mark-vs-temporal-returns"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6149
claim: "2026-08-06T01:33:05Z"
assignee: "date-assertion-value-mark-vs-temporal-returns"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `date-test-compare-enrollment` (the enrollment PR), which seeded
`date` into `scripts/test-compare/assertion-mismatch-mark.json` at
`{assertionCount: 0, kind: 0, value: 0}` — the honest number, because 0 of the
gem's 142 credited tests are matched today.

The problem is structural, not a seeding mistake. RFC 0088's headline decision is
that trails returns `Temporal` types where Ruby returns `Date`/`DateTime`/`Time`,
so a faithfully-ported gem test whose Ruby form asserts
`assert_equal Date.new(2001,2,3), Date.parse("2001-02-03")` produces an
**assertion-value mismatch by design**. `parity:test` matches on test names so
the test still counts, but the value counter goes up.

The ratchet is only-shrink and `nextMark` takes `Math.min` per counter
(`scripts/test-compare/assertion-ratchet.ts:126`), so `--write` can only lower
`date.value`, never raise it. The first ported gem test therefore reds
`pnpm parity:test:assertions` (CI's `Rails API/Test Comparison` job) at a mark
of 0, and there is no sanctioned way to move it.

Per CLAUDE.md the fix is **never** to reshape a Temporal return into a Ruby-shaped
one to silence the counter — that reverses the RFC's headline decision.

## Acceptance criteria

- [ ] Decide the mechanism and implement it. Candidates, in order of preference:
      (a) the assertion-value comparator recognises a Temporal-vs-Ruby-temporal
      pair as equivalent rather than a mismatch, so the counter never rises for
      the intended shape; (b) a scoped, reasoned exclusion in the same shape as
      `UNPORTED_FILES`; (c) an explicit one-time raise of `date.value` with the
      reason recorded — least preferred, since it is a widened baseline.
- [ ] Whatever lands, `pnpm parity:test:assertions` stays a real gate for
      `date` on the other two counters (`assertionCount`, `kind`) — those are
      genuine debt and must not be blanket-exempted.
- [ ] Do not raise any other package's counters.
- [ ] RFC 0088 README's "Known consequence" paragraph updated to record the
      mechanism chosen.
