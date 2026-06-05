---
title: "PR B — schema-ar-models.ts set connection() audit"
status: in-progress
updated: 2026-06-05
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 30
priority: 24
pr: 2961
claim: "2026-06-05T23:26:52Z"
assignee: "pr-b-schema-ar-models-audit"
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
