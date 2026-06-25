---
title: "find([id]) dispatches to single-id path (message + array wrap) like Rails"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `find_with_ids` unwraps a single-element array and dispatches to the
single-id path: `ids = ids.first if expects_array` then
`when 1 then find_one(ids.first); expects_array ? [result] : result`
(`finder_methods.rb:504,512-514`). So `Model.find([1])` on a missing record
raises `find_one(1)` → `"Couldn't find Model with 'id'=1"` (and returns
`[record]` on success).

trails' live finder path (`performFind`, `relation/finder-methods.ts`) routes a
single-element array through the multi-id branch: `find([1])` missing yields
`raiseNotFoundAll` → `"Couldn't find all Model with 'id': (1)"` instead of the
single-id message, and on success returns the bare record rather than a
1-element array wrapper. (The internal `findWithIds`/`findOne`/`findSome` helpers
have the same routing gap — `findWithIds` sends `wantArray` 1-element ids to
`findSome` rather than `findOne`.)

## Acceptance criteria

- `find([id])` on a missing record raises the single-id message
  `Couldn't find ${name} with '${pk}'=${id}` (scalar), matching Rails.
- `find([id])` on a found record returns a 1-element array (`expects_array`).
- Tests for both the missing-message and array-wrapping cases, named to match the
  Rails finder tests (read them first).
