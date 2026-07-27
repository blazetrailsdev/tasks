---
title: "Audit existing @noRailsEquivalent tags for convergeable surface"
status: draft
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5367 (`migrate-abstractcontroller-allow-entries`) was chartered to migrate
15 allow entries to `@noRailsEquivalent` tags and instead DELETED all of them:
auditing each one showed none described permanent trails-only surface. Every one
was convergeable or removable, so tagging would have moved the excuse from JSON
to JSDoc while leaving the work invisible. The package now reports 14 novel
extras with a story behind each.

The sibling migrations `migrate-activerecord-allow-entries` and
`migrate-globalid-allow-entries` are both done, and `api:extra` now reports 59
matched tags repo-wide. Those tags were migrated on the original charter —
move the entry, preserve the reason — without the convergeable-vs-permanent
test that PR #5367 applied. Some of them plausibly describe surface that should
be converged and untagged instead.

This also bears on `retire-extra-surface-allow-json`: entries that are
convergeable should be DELETED as part of that retirement, not migrated to tags.

A legitimately permanent tag looks like `[Symbol.toPrimitive]` in
`globalid/signed-global-id.ts` — a JS language necessity with no Ruby analogue.
A tag that merely records unfinished porting or a naming collision we could fix
is not permanent.

## Acceptance criteria

- Every `@noRailsEquivalent` tag in the repo is classified as permanent (a
  language-level or runtime-level fact that no port can remove) or convergeable
  (unfinished porting, a fixable naming collision, a tooling gap).
- Convergeable ones get a story registered and their tag deleted so the surface
  counts again; permanent ones keep the tag with the reason tightened to state
  WHY it is permanent, not merely what it is.
- Findings recorded as an audit report so the classification is reviewable.
- `pnpm api:extra` reports no stale tags afterwards.
