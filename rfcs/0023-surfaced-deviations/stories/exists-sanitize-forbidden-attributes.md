---
title: "exists?: port sanitize_forbidden_attributes in construct_relation_for_exists"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-03T00:21:51Z"
assignee: "exists-sanitize-forbidden-attributes"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4427. Rails'
`FinderMethods#construct_relation_for_exists` (finder_methods.rb:438) opens with
`conditions = sanitize_forbidden_attributes(conditions)` before the
Array/Hash/scalar case-analysis. trails' `constructRelationForExists`
(packages/activerecord/src/relation/finder-methods.ts) has no such call —
there is no ForbiddenAttributes / strong-parameters layer at this seam yet, so
condition hashes are passed through unsanitized.

This is a pre-existing gap (not introduced by #4427) and is blocked on the
broader absence of a ForbiddenAttributes/strong-parameters subsystem. The
"exists with strong parameters" finder port currently passes without it.

## Acceptance criteria

- [ ] Decide whether a ForbiddenAttributes seam exists/should exist in trails;
      if so, call it at the head of constructRelationForExists mirroring Rails.
- [ ] If the subsystem is genuinely absent, document the deviation as
      tracked-pending-convergence and gate this story on that subsystem's story.
