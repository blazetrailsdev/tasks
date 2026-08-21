---
title: "Re-measure collection-proxy.ts after the 57% burndown and re-cut the residue into stories"
status: done
updated: 2026-08-21
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6815
claim: "2026-08-21T12:20:33Z"
assignee: "remeasure-collection-proxy-residue-after-the-burndown"
blocked-by: null
closed-reason: null
---

## Context

RFC 0114's bucket table was measured on 2026-08-19 against a
`collection-proxy.ts` of **1,556 code lines** (2,938 raw). Measured today
(2026-08-21, `origin/main` at fc521e1b3):

```console
$ wc -l packages/activerecord/src/associations/collection-proxy.ts
1520
$ grep -vcE '^\s*(//|/\*|\*|$)' packages/activerecord/src/associations/collection-proxy.ts
675
```

**675 code lines** — a 57% burndown, and the per-method ratio against
`collection_proxy.rb`'s 148 code lines is now ~4.6x, down from 10.5x. Nineteen
stories are `done`; the delegate-table half (F7) landed in #6756, the
Enumerable block (F4) in #6759, the through-owner helpers and
`_buildThroughScope` (F2, partly) in their own PRs, `initialize` (F5) in #6745, the finder overrides (F3) in #6758, and the load/merge block (F6) in #6773.

What has NOT happened is a re-measurement. The RFC's remaining findings
(the F1 mutation-terminal residue, whatever is left of F2's `:through`
machinery, and any F3/F5 tail) were never re-cut into stories against the
post-burndown file, so after the 2026-08-21 triage — which closed the three
superseded `delegate-list-from-mixin-keys-bakeoff-*` stories and the stale
`proxy-record-delegates-read-through-merging-load-target` — this RFC has **no
schedulable story left**, while `collection-proxy.ts` is still 4.6x Rails.

## Acceptance criteria

- Re-run the RFC's own measurement method on today's file: fresh `pnpm build`,
  `API_COMPARE_FORCE=1 pnpm parity:api --calls`,
  `pnpm parity:api:extra --package activerecord --json`; classify every
  surviving member by bucket, blank/comment lines stripped, exactly as the
  2026-08-19 table does.
- Update RFC 0114's `## The measurement` section with the new table and note the
  1,556 → 675 delta and which stories retired which buckets.
- File the residual slices as new stories under 0114 (`pnpm tasks new`), each
  with its `file:line` citations and its Rails counterpart, sized under the PR
  LOC ceiling. If a bucket has genuinely converged, say so in the RFC rather
  than filing an empty story.
- Confirm the RFC's standing constraint still holds: **zero rows** for this
  `tsFile` in `output/call-mismatches.json` and `output/call-arg-mismatches.json`.
  If any row has appeared since 2026-08-19, that is a finding, not a baseline.
- If the re-measurement shows the residue is not worth a campaign, say that
  explicitly and recommend closing 0114 — that is an acceptable outcome of this
  story.
