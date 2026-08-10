---
title: "Reattach the rt_complete_frags JSDoc to completeFrags"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: 6337
claim: "2026-08-10T14:13:28Z"
assignee: "complete-frags-doc-orphaned-onto-julian-epoch-date"
blocked-by: null
closed-reason: null
---

## Context

`packages/date/src/date.ts` carries a JSDoc block describing
`rt_complete_frags` (`vendor/date/ext/date/date_core.c:3878-4036`) that is
attached to nothing: it sits immediately above `const JULIAN_EPOCH_DATE`
(`date_core.c:251`), several hundred lines away from `completeFrags`, the
function it documents. `completeFrags` itself therefore has no doc at all, and
the constant has a doc that describes a different thing entirely.

Noticed while porting `date__rfc2822` / `date__httpdate` in PR #6333, which
inserted its new functions next to the orphan and left it in place rather than
widening the diff.

## Converged shape

Move the `rt_complete_frags` block onto `completeFrags`, leaving
`JULIAN_EPOCH_DATE` with its own one-line `date_core.c:251` doc (which it
already has, directly beneath the orphan).

## Acceptance criteria

- [ ] The `rt_complete_frags` JSDoc is the doc comment of `completeFrags`.
- [ ] No other member gains or loses documentation; no behavioural change.
