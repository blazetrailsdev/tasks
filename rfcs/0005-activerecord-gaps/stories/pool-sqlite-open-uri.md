---
title: "Enable SQLITE_OPEN_URI for shared-cache :memory:"
status: ready
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`file:…?mode=memory&cache=shared` is not genuinely in-memory today because
`SQLITE_OPEN_URI` is not set in the better-sqlite3 open path; the current
fallback can leave stray on-disk artifacts.

## Acceptance criteria

- [ ] `SQLITE_OPEN_URI` enabled in the better-sqlite3 open path (if the binding
      allows)
- [ ] `file:…?mode=memory&cache=shared` is genuinely in-memory
- [ ] Stray on-disk artifacts from the old fallback gitignored / removed

## Notes

From the connection-pool gap plan (PF sqlite open-uri), ready if the binding
allows. ~30 LOC + ~10 LOC gitignore.
