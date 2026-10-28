---
title: "activemodel: a plain attribute read still pays respond_to? and super dispatch, ~1.5-2x 9e17ddc98d"
status: draft
updated: 2026-10-28
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From trailmap#89, re-measuring after trails#8540 (`trailmap-remeasure-attribute-reads-after-cast-cache-fix`).
trailmap at trails 165ae22, live tasks db (14,133 `Story` rows, SQLite), `scripts/bench-story-reads.ts`,
min-max of 5 runs, scaled to the parent story's 11,531 rows:

|                                   | `9e17ddc98d` | 165ae22    |
| --------------------------------- | ------------ | ---------- |
| 115,310 reads of `story.priority` | 14-15 ms     | ~19-33 ms  |
| sort by `(priority, id)`          | 69-93 ms     | ~94-148 ms |

Load (`Story.all()`, ~190-330 ms) and `story.id` reads are back in range; these two are not.

A CPU profile of the run (framework frames, self time) puts the cost outside `fetchValue`:
`basicObjRespondTo` (ruby-compat `object.ts`) 599 ms, `hashAref` 458 ms, `hasKey` 258 ms,
`rbCallSuper` (`include.ts`) 204 ms, the reader `get` in `attribute-methods/read` 204 ms,
`fetchValue` only 70 ms. A plain attribute reader seems to go through a `respond_to?` check and a
`super` dispatch on every call.

## Acceptance criteria

- [ ] 100,000 reads of a cast non-primary-key attribute on loaded records are at or under the
      `9e17ddc98d` figure (about 0.13 µs a read), measured by a bench in trails.
- [ ] trailmap's `priority` row and the `(priority, id)` sort re-measured within the `9e17ddc98d` column.
