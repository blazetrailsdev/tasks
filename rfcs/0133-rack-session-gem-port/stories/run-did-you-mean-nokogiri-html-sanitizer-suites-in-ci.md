---
title: "run-did-you-mean-nokogiri-html-sanitizer-suites-in-ci"
status: draft
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/ci-suite-coverage.test.ts`'s package half now probes each package
filter against the gate of the job that holds it (story
`ci-suite-coverage-guard-misses-prefix-named-packages`). Three packages pass
that check only through the `coverage:` job, which is `if: false`
(`.github/workflows/ci.yml:804`-ish, `coverage:` block) — a permanently
disabled job whose filter list at ci.yml:775-779 names
`packages/did-you-mean`, `packages/nokogiri` and `packages/html-sanitizer`.

No enabled job runs their suites: 5 + 2 + 4 test files today. The gate
probe treats a job with no `needs.changes.outputs.*` gate names in its `if:`
as unconditioned, so a literal `if: false` reads as live.

## Acceptance criteria

- `ciFiltersWithGates` (or its caller) treats a job whose `if:` is a literal
  `false` as dead, so its filters cover nothing.
- did-you-mean, nokogiri and html-sanitizer suites are registered in a job
  that actually runs, with a gate their own paths fire.
- No entry added to `KNOWN_UNRUN`.
