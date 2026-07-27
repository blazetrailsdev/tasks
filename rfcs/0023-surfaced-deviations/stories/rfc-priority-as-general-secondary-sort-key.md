---
title: "Decide whether RFC priority breaks ties when story priorities are equal"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
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

`comparePriority` (`scripts/tasks/cli.ts:364`) breaks a tie in effective
priority only when both stories' RFCs declare the SAME priority — then the RFC
with fewer stories remaining wins. When the RFC priorities DIFFER but the
effective priorities tie (e.g. two stories that each set `priority: 4`, one
under an RFC at priority 1 and one under an RFC at priority 2), the order is
left unchanged: stable index order.

Arguably the priority-1 RFC's story should lead, i.e. RFC priority should act
as a general secondary sort key. #5416 deliberately did not do this: it would
reorder existing story-priority ties, and the requested behaviour was scoped to
RFCs that match on priority. Pinned by the test "does not apply when the two
RFC priorities differ".

## Acceptance criteria

- Decide whether RFC priority becomes a general secondary key for stories whose
  effective priorities tie.
- If yes: implement in `comparePriority`, update `PRIORITY_LEGEND`, and replace
  the "does not apply when the two RFC priorities differ" test with one
  asserting the new order.
- If no: close this story with the reasoning recorded.
