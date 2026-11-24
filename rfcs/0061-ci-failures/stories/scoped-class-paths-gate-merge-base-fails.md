---
title: "scoped-class-paths-gate-merge-base-fails"
status: in-progress
updated: 2026-11-24
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10661
claim: "2026-11-24T02:43:58Z"
assignee: "scoped-class-paths-gate-merge-base-fails"
blocked-by: null
closed-reason: null
---

## Context

The scoped "Rails API/Test Comparison (scoped)" job's `class-paths` gate exits 1 with
`Command failed: git merge-base HEAD origin/main` (trails#10661, run 45249507537 job 137955484782,
and again run 45268118907 job 138020844227). The checkout lacks the history/ref the gate needs.

## Acceptance criteria

- [ ] The scoped job's checkout provides `origin/main` and enough depth for `git merge-base` (or the gate resolves the base the way the other scoped gates do, e.g. the assertions ratchet's base sha).
- [ ] `class-paths` passes on a PR that does not touch class paths.
