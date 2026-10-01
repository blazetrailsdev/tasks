---
title: "trails-tsc: single-build buildViews tests still run on the 5 s default timeout"
status: draft
updated: 2026-10-01
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8352 gave the two two-build tests in
`packages/trails-tsc/src/build-views.test.ts` the `30_000` timeout their
neighbours carry. 17 of the file's 36 tests still run on vitest's 5 s default,
and each of them runs at least one `buildViews`.

While verifying trails#8352, at host load average ~27, the single-build test
"emits all 4 artifacts with correct source map references"
(`packages/trails-tsc/src/build-views.test.ts:222`) failed once and passed on
the next two runs. The failure message was not captured, so a 5 s timeout is an
inference, not a confirmed cause: reproduce it under load first (run the file
while another suite is running) and read the message before changing anything.

TS-only tooling; no Rails counterpart.

## Acceptance criteria

- The cause of the one observed failure is confirmed from its message, or the
  story is closed as not reproducible.
- If it is the timeout: the file sets one timeout for every test that builds
  (a `describe`-level or `vi.setConfig({ testTimeout })` setting rather than 17
  more per-test arguments), and the now-redundant per-test `30_000` arguments
  are removed.
- No test name changes.
