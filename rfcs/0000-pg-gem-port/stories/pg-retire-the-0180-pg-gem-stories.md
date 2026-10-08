---
title: "Close the two RFC 0180 pg-gem stories as superseded and retag their receipts"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: migration
packages: ["activerecord"]
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

RFC 0180 has two stories this RFC's migration replaces:
`pg-gem-connection-surface-scores-against-the-pg-gem` (claimed 2026-10-08T17:05Z) and
`pg-gem-result-and-array-coders-score-against-the-pg-gem` (ready). 20 receipts in
`packages/activerecord/src/connection-adapters/postgresql/pg-connection.ts`, `pg-result.ts` and `oid/array.ts` name them, and closing a
story cited in code reds `stale-refs`.

Gated on RFC 0000-pg-gem-port open question 1 (what to do with the claimed one).

## Acceptance criteria

- [ ] In one trails PR, every receipt naming either story is retagged: `pg-result.ts`'s 12 onto `pg-result-moves-to-the-package`, `oid/array.ts`'s 6 onto `pg-array-coders-move-to-the-package`, `pg-connection.ts`'s 2 onto `pg-connection-escaping-moves-to-the-package`.
- [ ] After that PR merges, both stories are closed with `tasks close <id> "superseded by RFC <n>-pg-gem-port"`, and RFC 0180's README table rows for them are removed (a markdown PR in the tasks repo).
- [ ] `stale-refs` green on `main` afterwards.

## Notes

Run first if the owner answers open question 1 with "stop the claimed agent"; otherwise after that agent's PR merges.
