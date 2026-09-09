---
title: "Shrink the CI gates to fixture size"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["run-the-equivalence-gates-against-the-live-pair"]
deps-rfc: []
est-loc: 250
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Once tier 4 runs against the live pair, CI's job changes: catch an obvious
regression on a pull request, fast. It does not need to rebuild the whole
content tree or carry a vendored ringo snapshot to do that.

This is the story that pays the CI wall-clock dividend, and it is deliberately
second. Nothing is removed from CI before its replacement has been green in
production.

## Acceptance criteria

- [ ] The CI gates run over a committed fixture rather than a full ingest of
      the content repo
- [ ] The `gate` job's wall-clock time falls measurably, and the number is
      recorded in the PR
- [ ] The fixture covers each gate's known edge cases, named in its source
- [ ] The vendored ringo files CI needs reach zero, or the remainder is
      justified in a comment
- [ ] The self-tests still run in CI

## Verification

CI stays red for a regression the full gate would have caught, proven by
re-running the fixture gate against a known-bad commit.
