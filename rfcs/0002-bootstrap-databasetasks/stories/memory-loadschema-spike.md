---
title: "Spike — reconstructFromSchema on sqlite :memory: pool:1"
status: done
updated: 2026-06-07
rfc: "0002-bootstrap-databasetasks"
cluster: bootstrap
deps: []
deps-rfc: []
est-loc: 50
priority: 1000002
pr: 2996
claim: "2026-06-07T15:32:02Z"
assignee: "memory-loadschema-spike"
blocked-by: null
---

## Context

sqlite `:memory: pool:1` is the default local path for most contributors, and
it is exactly where the pool epic's D-0 `loadSchema` deadlock bit.
`reconstructFromSchema` adds purge+create on top. Before the PR 2 rewrite relies
on this path, a throwaway spike must prove it comes back clean.

See RFC 0002 §Risk controls.

## Acceptance criteria

- [ ] Throwaway spike runs `reconstructFromSchema` (and `loadSchema`) against
      sqlite `:memory: pool:1` and reports whether it deadlocks or completes
      cleanly
- [ ] Findings recorded on the [[rework-test-setup]] story (which driver path
      is safe: `loadSchema` for memory, `reconstructFromSchema` for persistent)

## Notes

Gates [[rework-test-setup]] (PR 2). Workaround on record if it deadlocks:
explicit `this.attribute()`. Spike code is throwaway — do not merge it.
