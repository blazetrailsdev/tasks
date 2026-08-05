---
title: "corelib-test-compare-enrollment"
status: draft
updated: 2026-08-05
rfc: "0000-corelib-package"
cluster: null
deps: ["move-date-time-to-corelib", "vendor-ruby-spec-subset"]
deps-rfc: []
est-loc: 250
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**This is the story that gives the cluster a stopping condition.** It is the
point of the RFC.

RFC 0074's date cluster has run to 32 stories / 3,510 est-loc / 24 merged PRs
with no gate that can ever go green, because there is no vendored test suite to
compare against. Its two test files —
`date.trails.test.ts` (567 lines) and `time.trails.test.ts` (123) — use the
`.trails.test.ts` suffix, which marks TS-only extras and is outside the compared
population by construction. So the cluster's only feedback signal is its own
bespoke tests, which is why it has no natural end.

Enrolling `vendor/date/test/date/` and the `ruby/spec` subset gives it a real,
shrinking, self-terminating measure.

**`ruby/spec` enrolls in `test:compare` only** — never `api:compare`.
`Module#include`/`#prepend` are interpreter internals with no portable source.
Conflating the two contracts produces an enrollment that cannot pass.

## Acceptance criteria

- [ ] `compareTests: true` for the `date` source and the `ruby_spec` source.
- [ ] `ruby_spec` keeps `compareApi: false` **permanently**.
- [ ] **Enrollment is 4 registrations, not 1** — a partial job reds CI with a
      fully green local compare (the assertion-mismatch mark). Enumerate and
      verify each before pushing.
- [ ] `pnpm test:compare` delta non-negative; the new baseline recorded.
- [ ] Deferred suites excluded via the documented mechanism with real reasons —
      not by deleting tests.
- [ ] The RFC README updated with the starting match percentage, so the burndown
      has a baseline to measure against.
