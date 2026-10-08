---
title: "Close the RFC 0180 sqlite3-gem story as superseded and retag its receipts"
status: draft
updated: 2026-10-08
rfc: "0187-sqlite3-gem-port"
cluster: migration
packages: ["activerecord"]
deps: ["sqlite3-lift-the-nested-port-into-a-package"]
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
four acceptance criteria; RFC 0187-sqlite3-gem-port § "Migration" steps 2 and 4 are those
criteria. 9 receipts name it, identified here by symbol because this story runs after the lift moves the
files: in `errors.ts`, the receipts on `status2klass`, `nativeStatus`, `sqlite3Errmsg`,
`rbSqlite3Raise` and `rbSqlite3RaiseWithSql`; and the file-level cover that opens each of
`better-sqlite3.ts`, `libsql.ts`, `node-sqlite.ts`, `expo-sqlite.ts`. Find them with
`grep -rn "sqlite3-gem-c-surface-and-driver-covers" packages/`; the count must be 9 before and 0 after.
Closing a story cited in code reds `stale-refs`.

## Acceptance criteria

- [ ] In one trails PR the 9 receipts are retagged, story id only, nothing else on the line changed. `status2klass`, `rbSqlite3Raise` and `rbSqlite3RaiseWithSql` become `@noRailsEquivalent CONVERGEABLE sqlite3-enroll-the-c-extension-surface`. `nativeStatus` and `sqlite3Errmsg` become `CONVERGEABLE sqlite3-better-sqlite3-engine` (the first engine story; each later engine story takes its own branch out). Each file cover becomes `CONVERGEABLE <that file's engine story>`, keeping its `MOVED-BY-SHORT-NAME:` list.
- [ ] A receipt that names the story which will delete it is the normal lifecycle, not a contradiction: `CONVERGEABLE <id>` means "`<id>` removes this". The retag changes who owns the removal; the enroll and engine stories still delete the tags.
- [ ] After it merges, the 0180 story is closed with `tasks close <id> "superseded by RFC <n>-sqlite3-gem-port"` and RFC 0180's README row for it is removed by markdown PR.
- [ ] `stale-refs` green on `main`.

## Notes

Depends on the lift so that it edits the files at their final paths once, instead of racing a
4,386-line move. If the lift is delayed and RFC 0180's close-out is waiting on this story, drop
the dep with `tasks set-deps` and run it against the pre-lift paths: the symbols are the same.
