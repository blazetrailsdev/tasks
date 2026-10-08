---
title: "Close the two RFC 0180 pg-gem stories as superseded and retag their receipts"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: migration
packages: ["activerecord"]
deps:
  - "pg-result-moves-to-the-package"
  - "pg-array-coders-move-to-the-package"
  - "pg-connection-escaping-moves-to-the-package"
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0180 has two stories this RFC's migration replaces:
`pg-gem-connection-surface-scores-against-the-pg-gem` and
`pg-gem-result-and-array-coders-score-against-the-pg-gem`. 20 receipts name them (12 in
`pg-result.ts`, 6 in `oid/array.ts`, 2 in `pg-connection.ts`, all under
`packages/activerecord/src/connection-adapters/postgresql/`), and closing a story still cited in
code reds `stale-refs`.

No receipt is retagged. Each is deleted by the move story that owns it, which are this story's
three dependencies. This story runs last and only closes what nothing cites any more.

## Acceptance criteria

- [ ] `grep -rn "pg-gem-connection-surface-scores-against-the-pg-gem\|pg-gem-result-and-array-coders-score-against-the-pg-gem" packages/` returns nothing. If it returns anything, a dependency did not finish its job: reopen that story, do not retag here.
- [ ] For each of the two stories that is not already `done` or `closed`: `tasks close <id> "superseded by RFC <n>-pg-gem-port"`. One that reached `done` on its own is left alone.
- [ ] RFC 0180's README table rows for any story closed here are removed by markdown PR in the tasks repo.
- [ ] `stale-refs` is green on trails `main` afterwards.

## Notes

This story changes no trails source; its est-loc is the tasks-repo README edit. What happens to the
two stories between activation and this point (block them so they are not claimed, or let work
already in flight land) is RFC § "Migration" and open question 1, decided by the owner at
activation.
