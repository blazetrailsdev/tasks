---
title: "retire-stale-blocked-skip-citations-in-actionview-tests"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9174
claim: "2026-10-21T14:05:15Z"
assignee: "has-many-through-collection-inverse-sends-reader-append"
blocked-by: null
closed-reason: null
---

## Context

actionview's 86 skipped tests carry `BLOCKED: <story-id>` or `PERMANENT-SKIP:`
lines, and resolving each cited id against the tasks DB (2026-10-20) turns up
**citations pointing at finished work**:

| cited story                                                | status   | skips still citing it                                                  |
| ---------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `port-template-test-case-test`                             | `done`   | `template/test.test.ts` (7), `activerecord/relation-cache.test.ts` (1) |
| `action-controller-render-is-untyped`                      | `done`   | 1                                                                      |
| `builder-template-handler-and-actionpack-builder-fixtures` | `closed` | 1 — successor is `port-builder-template-handler` (ready)               |

`template/test.test.ts` is 0/7 — the whole file is skipped behind a story that
is already done, so the parity figure counts 7 tests as blocked work that
nothing is waiting on. `template/sanitize-helper.test.ts` (4 skips) cites
`html-sanitizer-port-scrubbers` (`draft`) and
`html-sanitizer-safe-list-sanitize-css` (`blocked`), which are live and
correct.

`scripts/stale-story-references.test.ts` reds on references to closed and
sibling-landed stories, so the closed one may already be CI-visible; the
`done` ones are the silent half.

## Acceptance criteria

- Every `BLOCKED:` citation in `packages/actionview/src/**/*.test.ts` resolves
  to a story that is not `done` or `closed`.
- A skip whose blocker is finished is either un-skipped and made to pass, or
  re-pointed at the live story that actually blocks it, or converted to
  `PERMANENT-SKIP:` citing the ratified CLAUDE.md section.
- `template/test.test.ts`'s 7 skips are resolved one way or the other, and the
  file is no longer 0/7.
- `scripts/stale-story-references.test.ts` is green, and
  `pnpm parity:test --package actionview` reports a skip count that matches
  only live blockers and permanent rulings.
