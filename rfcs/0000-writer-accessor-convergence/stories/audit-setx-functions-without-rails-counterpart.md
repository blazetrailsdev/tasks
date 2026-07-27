---
title: "Audit the 28 setX functions with no Rails counterpart"
status: draft
updated: 2026-07-27
rfc: "0000-writer-accessor-convergence"
cluster: extra-surface
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

The third population found while classifying the repo's 95 exported `setX`
functions: 28 have NO Ruby counterpart under either spelling (`set_x` or `x=`),
so they are neither faithful ports nor writer re-spellings. They are currently
unclassified, and some are almost certainly trails-only seams that should be
justified in place rather than converged.

Examples: `setModelFinder` (`globalid` `locator.ts`),
`setCurrentAdapterResolver` (`activerecord` `type.ts`), `setDjasScopeBuilder`
and `setAssociationRelationFactory` (`activerecord` `associations/_scope-slots.ts`),
`setReloadRoutesHook` (`trailties` `engine/lazy-route-set.ts`),
`setGlobalPreviousSchemesFn` (`activerecord` `encryption/encrypted-attribute-type.ts`),
the `time-travel.ts` group, and test-only helpers
(`test-helpers/ddl-profile.ts`).

Two are not writers at all — `setDifference` and `setIntersection`
(`activerecord` `associations/has-many-association.ts`) are set-theory helpers
that the `setX` grep over-collects.

## Acceptance criteria

- Each of the 28 is classified: faithful port under a name the classifier missed
  (irregular Rails spelling), a writer that belongs in one of this RFC's
  convergence stories, a genuine trails-only seam, or a false positive.
- Findings recorded as an audit report; anything convergeable is registered as a
  story rather than fixed here.
- Genuine seams get the justification they need AT THE CALL SITE, and are NOT
  added to `extra-surface-allow.json` if a convergence story exists for them.
