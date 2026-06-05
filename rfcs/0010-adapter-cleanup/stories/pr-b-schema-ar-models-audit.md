---
title: "PR B — schema-ar-models.ts set connection() audit"
status: ready
updated: 2026-06-04
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 30
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The `set connection()` rename (PR 1a) has landed; re-check whether the
`schema-ar-models.ts` cleanup is still needed.

See RFC 0010 §Remaining work (PR B).

## Acceptance criteria

- [ ] `packages/activerecord/src/schema-ar-models.ts` audited for remaining
      `set adapter()` usage
- [ ] Updated to `set connection()` if any callers remain
- [ ] If zero references, close as moot (documented in the PR body)

## Notes

From the adapter-cleanup plan (PR B). May be moot — the audit decides.
