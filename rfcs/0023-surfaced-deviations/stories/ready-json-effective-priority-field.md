---
title: "Decide whether --json rows expose effective priority"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ready --json` and `list --json` print raw index rows
(`scripts/tasks/cli.ts:3141` and the `list` case below it), so a story that
inherits its RFC's priority serialises as `priority: null`. The row ORDER is
correct — `ready()` sorts by effective priority — but a consumer that reads the
field rather than trusting the order will disagree with the table, which
renders the inherited value as `N*`.

This was a deliberate scope call in #5416 (order is the contract), but agents
increasingly script against `--json`.

## Acceptance criteria

- Decide the shape: an added `effective_priority` field on the JSON rows, or a
  documented statement that order is the only contract.
- If a field is added, it appears in `ready --json`, `list --json` and
  `next-bundle --json`, and does not shadow the authored `priority`.
- Tests cover an inherited priority and a story-set priority.
