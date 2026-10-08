---
title: "Close the RFC 0180 sqlite3-gem story as superseded and retag its receipts"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
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

`sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem` (RFC 0180, ready) has
four acceptance criteria; RFC 0000-sqlite3-gem-port § "Migration" steps 2 and 4 are those
criteria. 9 receipts name it: `packages/activerecord/src/sqlite/errors.ts:131,195,212,224,237` and the file-level
covers at line 1 of `better-sqlite3.ts`, `libsql.ts`, `node-sqlite.ts`, `expo-sqlite.ts`.
Closing a story cited in code reds `stale-refs`.

## Acceptance criteria

- [ ] In one trails PR the receipts are retagged: `errors.ts`'s three C ports onto `sqlite3-enroll-the-c-extension-surface`; `nativeStatus` and `sqlite3Errmsg` and each file cover onto that file's engine story.
- [ ] After it merges, the 0180 story is closed with `tasks close <id> "superseded by RFC <n>-sqlite3-gem-port"` and RFC 0180's README row for it is removed by markdown PR.
- [ ] `stale-refs` green on `main`.

## Notes

Can run as soon as this RFC is active; it does not wait for the lift.
