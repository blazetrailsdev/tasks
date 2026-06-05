---
title: "Re-audit 11 still-skipped connection-handler.test.ts tests"
status: ready
updated: 2026-06-04
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 50
priority: 35
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

11 `connection-handler.test.ts` tests stayed skipped from earlier pool work. Now
that nested `connectedTo` switching is live, re-audit them: fix the ones that now
pass, and split the remainder by blocker (process-fork = permanent skip;
schema-cache = not-yet-implemented).

## Acceptance criteria

- [ ] Each of the 11 skipped tests re-checked against current behavior
- [ ] Newly-passing tests unskipped
- [ ] Remainder labeled by blocker (process-fork permanent vs schema-cache TODO)

## Notes

From the connection-pool gap plan (PF5). Triage + fixes; hard to size precisely
before the audit.
