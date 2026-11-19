---
title: "spawn loop: never pick a story with a non-empty assignee"
status: draft
updated: 2026-11-19
rfc: "0252-external-contributor-prs"
cluster: trust-gate
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

An external contributor working on a story is recorded as `assignee:
<login>` with `claim: null`. The spawn loop must not hand that story to an
agent at the same time.

## Acceptance criteria

- A test pins that the spawn loop skips `ready` stories whose `assignee` is
  set, and picks the same story once `assignee` is cleared.
- If the loop does not already skip them, fix that here.
