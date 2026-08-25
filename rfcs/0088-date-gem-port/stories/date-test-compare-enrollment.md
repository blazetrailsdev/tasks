---
title: "date-test-compare-enrollment"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["move-date-time-to-date-package"]
deps-rfc: []
est-loc: 250
pr: 6148
claim: "2026-08-06T01:13:05Z"
assignee: "date-api-compare-enrollment"
blocked-by: null
closed-reason: null
---

## Context

**This is the story that gives the date cluster a stopping condition.** It is the
point of the RFC.

RFC 0074's date cluster has run to 32 stories / 3,510 est-loc / 24 merged PRs
with no gate that can ever go green, because there is no vendored test suite to
compare against. Its two test files — `date.trails.test.ts` (567 lines) and
`time.trails.test.ts` (123) — use the `.trails.test.ts` suffix, which marks
TS-only extras and is outside the compared population by construction. So the
cluster's only feedback signal is its own bespoke tests, which is why it has no
natural end.

Enrolling `vendor/date/test/date/` gives it a real, shrinking, self-terminating
measure. **Per the RFC's contract, the gem's test suite is the fidelity measure**
— not a method-by-method mirror of Ruby's internal representation.

### Assertion-value mismatches are expected here, and are benign

The RFC returns `Temporal` types by default where Ruby returns `Date`/`DateTime`/
`Time`. So a ported test whose Ruby form asserts
`assert_equal Date.new(2001,2,3), Date.parse("2001-02-03")` compares a
`Temporal.PlainDate` on our side.

`parity:test` matches on test **names**, so the test still counts. The
value-shape difference is the intended design, not drift. **Record this
explicitly in the RFC README and at the enrollment site** so a later reader does
not "converge" it back to a Ruby-shaped return — that would silently reverse the
RFC's headline decision.

## Acceptance criteria

- [ ] `compareTests: true` for the `date` source (`testPath: "test/date"`).
- [ ] **Enrollment is 4 registrations, not 1** — a partial job reds CI with a
      fully green local compare (the assertion-mismatch mark). Enumerate and
      verify each before pushing.
- [ ] `pnpm parity:test` delta non-negative; the new baseline recorded.
- [ ] Test names match the gem's names exactly — per CLAUDE.md, never reword a
      test name to fit the implementation. If a name and a behavior disagree, the
      implementation is what changes.
- [ ] Deferred suites excluded via the documented mechanism with real reasons —
      not by deleting tests.
- [ ] A note in the RFC README recording that assertion-value mismatches against
      `Temporal` returns are expected and benign, with the reasoning above.
- [ ] The RFC README updated with the starting match percentage, so the burndown
      has a baseline.
