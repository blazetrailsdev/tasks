---
title: "Call-less @missingRailsCall tag is silently ignored"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5868
claim: "2026-08-02T10:56:49Z"
assignee: "call-less-missing-rails-call-tag-silently-ignored"
blocked-by: null
closed-reason: null
---

## Context

`TAG_LINE` (`scripts/api-compare/missing-rails-call-tags.ts:50`) requires a call
name: `/^\s*\*?\s*@missingRailsCall\s+(\S+)(?:\s+—\s?(.*))?$/`. A tag written
with NO call at all — `/** @missingRailsCall */`, or a block line whose only
content is the bare tag — matches nothing, so it is treated as prose: no
suppression, no stale-tag report, and no empty-reason error from `parity:api:reasons`.

This is the same quiet-direction hazard #5856 fixed for the one-line form, one
level up: there the tag had a call and was silently dropped; here the tag has no
call and is silently dropped. It is pre-existing in BOTH the block and one-line
forms (#5856 deliberately left it alone — it was out of that story's scope), so
it is not a regression, but it is the last way to write a `@missingRailsCall`
that the load-bearing parser ignores without complaint.

`parity:api:build` never emits a call-less tag, so this is purely a hand-authored-tag
hazard.

## Acceptance criteria

- A `@missingRailsCall` with no call name is a hard error naming the
  `file:line`, in the same family as the empty-reason contract, in both block
  and one-line comment forms.
- The error message distinguishes "needs a call" from the existing
  "needs a reason".
- `parity:api:reasons` over the committed tree still passes (no existing tag in the
  tree is call-less).
- Tests in `missing-rails-call-tags.test.ts` alongside the boundary cases.
