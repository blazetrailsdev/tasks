---
title: "Remove stray 'file::memory:?cache=shared' junk file tracked at repo root"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: 40
pr: 3893
claim: "2026-06-22T16:35:57Z"
assignee: "remove-stray-sqlite-uri-junk-file-from-repo-root"
blocked-by: null
---

## Context

A stray junk artifact is committed at the repo root on `main`: a file literally
named `file::memory:?cache=shared` (an SQLite connection URI accidentally
materialized as a file, almost certainly from a test/script that opened
`file::memory:?cache=shared` without the sqlite URI flag so it created a real
file). Confirmed tracked: `git ls-tree origin/main --name-only | grep memory:`
returns it. Discovered during the PR #3595 salvage (it was also dragged through
the stale #1606 branch); #3595 deliberately did NOT carry it over, but it
remains on `main` independently.

## Acceptance criteria

- `git rm 'file::memory:?cache=shared'` from the repo root; confirm
  `git ls-tree HEAD --name-only` no longer lists it.
- Identify and fix the source that created it (grep for
  `file::memory:?cache=shared` / `:memory:?cache=shared` opened without the
  sqlite `?` URI mode flag in scripts/tests) so it doesn't regenerate, OR add
  it to `.gitignore` if the path is an unavoidable transient.
- Verify nothing references the file as a real path.
